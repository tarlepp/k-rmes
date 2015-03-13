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
  var self = this;

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

    return player;
  });

  // Set initial level coordinates
  self.grid = data.level.map;
};

/**
 * Apple setter method, this is called when server sends 'apple' message.
 *
 * @param {number[]}  data  Data from server
 */
Level.prototype.setApple = function consumeApple(data) {
  var self = this;

  Logger.info('got new apple', JSON.stringify(data));

  self.appleX = data[0];
  self.appleY = data[1];

  // TODO: calculate paths for each snake to apple
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
      grid[point[0]][point[1]] = 1;
    } else { // Oh noes, or not :D
      Logger.warn('Reserved point is out of grid, hopefully another player is out of the game', JSON.stringify(point));
    }
  }

  // Apple is always acceptable :D
  grid[self.appleX][self.appleY] = 0;

  return grid;
};

module.exports = Level;
