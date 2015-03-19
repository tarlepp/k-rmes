'use strict';

/**
 * level.js
 *
 * This file contains Level class and all necessary logic for level specified data handling. Following are the main
 * purposes of this class:
 *
 *  1) Keep level/map information
 *  2) Get current grid with reserved points (reserved points === where other snakes + I'm now)
 *  3) Calculate each snake path to apple, when it's set
 */

/**#@+
 * Module dependencies
 *
 * @type {exports}
 */
var _ = require('lodash');
var bluebird = require('bluebird');

var Path = require('./path');

/** @type {LoggerInstance} */
var Logger = require('./logger');
/**#@-*/

/**
 * Level class constructor.
 *
 * @param   {String}  player  Name of the current player
 * @constructor
 */
function Level(player) {
  var self = this;

  Logger.silly('Level class initialized.', JSON.stringify(arguments));

  // Initialize class properties
  self.width = 0;
  self.height = 0;
  self.appleX = false;
  self.appleY = false;
  self.player = player;
  self.playerIndex = false;
  self.players = [];
  self.grid = [];
}

/**
 * Grid setter method, this is called when server sends 'start' message.
 *
 * @param {{
 *    players: {
 *      name: string
 *    }[],
 *    level: {
 *      width: number,
 *      height: number,
 *      map: *[]
 *    }
 *  }}  data  Data from server
 */
Level.prototype.setGrid = function setGrid(data) {
  var self = this;

  // Set level width and height
  self.width = data.level.width;
  self.height = data.level.height;

  // Set player index
  self.playerIndex = _.findIndex(data.players, { name: self.player });

  // Set players
  self.players = _.map(data.players, function iterator(player) {
    player.body = [];
    player.path = [];
    player.pathTime = 0;

    return player;
  });

  // Reserved points on current map
  self.reservedPoints = [];

  // Set initial level coordinates
  self.grid = data.level.map;
};

/**
 * Apple setter method, this is called when server sends 'apple' message. Actual data contains just X and Y positions
 * of apple. After this we need to calculate paths for each snake position to apple.
 *
 * @param {number[]}  data  Data from server
 */
Level.prototype.setApple = function consumeApple(data) {
  var self = this;

  Logger.info('got new apple', JSON.stringify(data));

  self.appleX = data[0];
  self.appleY = data[1];

  // Calculate paths to apple
  self.calculatePaths();
};

/**
 * Setter method for players data. This will trigger paths calculation event.
 *
 * @param {{
 *  alive: boolean,
 *  body: *[],
 *  direction: number,
 *  growLength: number
 * }[]}   data
 *
 * @return  {Promise}
 */
Level.prototype.setPlayers = function setPlayers(data) {
  var self = this;

  for (var i = 0; i < data.length; i++) {
    self.players[i] = _.assign(self.players[i], data[i]);
  }

  // Get current reserved points according to snake locations
  self.reservedPoints = _.flatten(_.map(self.players, function iterator(snake) { return snake.body; } ));

  return self.needReCalculate()
    .then(
      function onSuccess(result) {
        return self.calculatePaths(result);
      })
    .then(
      function onSuccess(result) {
        return result;
      }
    )
  ;
};

/**
 * Method to determine if we need to re-calculate paths to apple or not.
 *
 * @returns {Promise}
 */
Level.prototype.needReCalculate = function needReCalculate() {
  var self = this;

  var resolver = bluebird.defer();
  var opponents = _.clone(self.players);
  var output;

  // My path is not calculated
  if (self.players[self.playerIndex].path.length === 0) {
    output = true;
  } else {
    // Remove my snake from opponents
    opponents.splice(self.playerIndex, 1);

    // Determine reserved points of each opponent snake
    var reservedPoints = _.flatten(_.map(opponents, function iterator(snake) { return snake.body; } ));

    // Get my current path to apple
    var myPath = self.players[self.playerIndex].path;

    /**
     * Iterator function to flatten specified coordinates
     *
     * @param   {[number, number]}  coordinates
     * @returns {string}
     */
    var iterator = function iterator(coordinates) {
      return coordinates[0].toString() + '-' + coordinates[1].toString();
    };

    // Flatten X and Y coordinates to simple array, this is needed for simple difference calculation
    reservedPoints = _.map(reservedPoints, iterator);
    myPath = _.map(myPath, iterator);

    // Remove apple from my path, it's not relative here
    myPath.pop();

    // Calculate difference between my path and other snakes positions
    var diff = _.difference(myPath, reservedPoints);

    // And if there is no difference no need to calculate path!
    output = diff.length !== myPath.length;
  }

  resolver.resolve(output);

  return resolver.promise;
};

/**
 * Helper method to calculate paths of each snake to apple. Note that this is done via promises.
 *
 * @param   {boolean} [needToCalculate] Do we need to calculate paths again or can we trust existing paths
 *
 * @return  {Promise}
 */
Level.prototype.calculatePaths = function calculatePaths(needToCalculate) {
  var self = this;

  return bluebird.map(self.players, function iterator(player) {
      var resolver = bluebird.defer();

      if (player.body.length === 0) {
        resolver.resolve([]);

        return resolver.promise;
      } else if (needToCalculate === false) {
        player.path.pop();

        resolver.resolve(player.path);

        return resolver.promise;
      }

      var startX = player.body[0][0];
      var startY = player.body[0][1];
      var endX = self.appleX;
      var endY = self.appleY;
      var grid = self.getGrid();
      var timeStart = new Date();

      return Path
        .findEasyStarPromise(startX, startY, endX, endY, grid)
        .then(
          function onSuccess(path) {
            if (path === false) {
              Logger.warn('Path not found to apple for player \'' + player.name + '\'');

              path = [];
            } else {
              path.pop();

              // Set player data
              player.path = path;
              player.pathTime = new Date() - timeStart;

              Logger.info(
                'Player \'' + player.name + '\' path length is ' + path.length +
                ', calculation done in ' + player.pathTime + 'ms'
              );
            }

            return path;
          }
        )
      ;
  });
};

/**
 * Getter method for current grid, with reserved points. Output is an array which contains X and Y points of current
 * grid. Actual value contains information about is "cell" reserved or not: 1 = reserved / wall, 0 = free point.
 *
 * Example of output:
 *
 * var grid = [
 *  [0,0,0,0,0,0]
 *  [0,0,0,0,0,0]
 *  [0,0,1,1,1,0]
 *  [0,0,0,0,1,0]
 *  [1,1,0,0,0,0]
 *  [0,1,1,1,0,0]
 * ];
 *
 * @param   {*[]} [reservedPoints]  Reserved points
 * @returns {*[]}
 */
Level.prototype.getGrid = function getGrid(reservedPoints) {
  var self = this;
  var grid = _.clone(self.grid);

  reservedPoints = reservedPoints || self.reservedPoints;

  // No point to go any further
  if (!_.isArray(reservedPoints) || reservedPoints.length === 0) {
    return grid;
  }

  // Remove not needed values
  reservedPoints = _.compact(reservedPoints);

  // Iterate given points
  for (var i = 0; i < reservedPoints.length; i++) {
    var point = reservedPoints[i];

    // Check that current point is in the grid
    if (point[0] >= 0 && point[0] < self.width && point[1] >= 0 && point[1] < self.height) {
      grid[point[1]][point[0]] = 1;
    } else { // Oh noes, or not :D
      Logger.warn('Reserved point is out of grid, hopefully another player is out of the game', JSON.stringify(point));
    }
  }

  // Apple is always acceptable :D
  grid[self.appleY][self.appleX] = 0;

  return grid;
};

module.exports = Level;
