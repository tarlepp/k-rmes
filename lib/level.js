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
  var _this = this;

  Logger.silly('Level class initialized.', JSON.stringify(arguments));

  // Initialize class properties
  _this.width = 0;
  _this.height = 0;
  _this.appleX = false;
  _this.appleY = false;
  _this.player = player;
  _this.playerIndex = false;
  _this.players = [];
  _this.grid = [];
  _this.timeLeft = 0;
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
  var _this = this;

  // Set level width and height
  _this.width = data.level.width;
  _this.height = data.level.height;

  // Set player index
  _this.playerIndex = _.findIndex(data.players, { name: _this.player });

  // Initialize players data
  _this.players = _.map(data.players, function iterator(player) {
    player.body = [];
    player.path = [];
    player.pathTime = 0;
    player.previousGrowLength = 0;

    return player;
  });

  // Reserved points on current map
  _this.reservedPoints = [];

  // Set initial level coordinates
  _this.grid = data.level.map;
};

/**
 * Apple setter method, this is called when server sends 'apple' message. Actual data contains just X and Y positions
 * of apple. After this we need to calculate paths for each snake position to apple.
 *
 * @param {number[]}  data  Data from server
 */
Level.prototype.setApple = function consumeApple(data) {
  var _this = this;

  Logger.info('Got new apple', JSON.stringify(data));

  _this.appleX = data[0];
  _this.appleY = data[1];
};

/**
 * Setter method for players data. This will trigger paths calculation event.
 *
 * @param {{
 *  snakes: {
 *    alive: boolean,
 *    body: *[],
 *    direction: number,
 *    growLength: number
 *  }[],
 *  timeLeft: number
 * }}   data
 */
Level.prototype.setPlayers = function setPlayers(data) {
  var _this = this;
  var snakes = data.snakes;

  // Store time left value
  _this.timeLeft = data.timeLeft;

  // Iterate each snakes
  for (var i = 0; i < snakes.length; i++) {
    // Set previous grow length
    _this.players[i].previousGrowLength = _this.players[i].growLength || 0;

    // And replace existing player values with new ones
    _this.players[i] = _.assign(_this.players[i], snakes[i]);
  }

  // Set current reserved points according to snakes locations
  _this.reservedPoints = _.flatten(_.map(_this.players, function iterator(snake) {
    // Remove last element, this is not relevant. Only if grow length is same as before and length matches with body
    if (snake.growLength === snake.body.length && snake.growLength > 2) {
      snake.body.pop();
    }

    return snake.body;
  }));
};

/**
 * Helper method to make reserved points to current grid.
 *
 * @param   {Grid}                grid                Current grid instance
 * @param   {[number, number][]}  opponentsMovements  Assumed opponents movements according to current data
 * @param   {number}              playerIndex         Player index number
 */
Level.prototype.setReservedPoints = function setReservedPoints(grid, opponentsMovements, playerIndex) {
  var _this = this;

  // Get current reserved points from level
  var points = _this.reservedPoints;

  // If player himself, add predicted opponents movements to points
  if (playerIndex === _this.playerIndex) {
    points = points.concat(opponentsMovements);
  }

  // Get length of points
  var pointsLength = points.length;

  // Iterate each reserved point, these are basically snake bodies
  for (var i = 0; i < pointsLength; i++) {
    var point = points[i];

    // Check that current point is in the grid
    if (point[0] >= 0 && point[0] < _this.width && point[1] >= 0 && point[1] < _this.height) {
      grid.setWalkableAt(point[0], point[1], false);
    } else { // Oh noes, or not :D
      Logger.warn(
        'Reserved point is out of grid, hopefully another player is out of the game',
        JSON.stringify(point)
      );
    }
  }

  // Make sure that actual apple is always walkable
  grid.setWalkableAt(_this.appleX, _this.appleY, true);
};

module.exports = Level;
