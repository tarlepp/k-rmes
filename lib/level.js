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
 *  alive: boolean,
 *  body: *[],
 *  direction: number,
 *  growLength: number
 * }[]}   data
 */
Level.prototype.setPlayers = function setPlayers(data) {
  var _this = this;
  var previousGrowLength = [];

  for (var i = 0; i < data.length; i++) {
    previousGrowLength[i] = _this.players[i].growLength || 0;

    _this.players[i] = _.assign(_this.players[i], data[i]);
  }

  // Set current reserved points according to snakes locations
  _this.reservedPoints = _.flatten(_.map(_this.players, function iterator(snake, index) {
    // Remove last element, this is not relevant. Only if grow length is same as before.
    if (previousGrowLength[index] === snake.growLength) {
      snake.body.pop();
    }

    return snake.body;
  }));
};

module.exports = Level;
