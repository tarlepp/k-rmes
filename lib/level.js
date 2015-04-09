'use strict';

/**
 * level.js
 *
 * This file contains Level class and all necessary logic for level specified data handling. Following are the main
 * purposes of this class:
 *
 *  1) Keep track of map/players/reserved points/apple information (these are the main purposes)
 *  2) Update apple position
 *  3) Update player data on every server tick
 *  4) Set reserved points for path finding grid
 *
 * Basically this is the where all the needed 'information' is stored...
 */

/**#@+
 * Module dependencies
 *
 * @type {exports}
 */
var _ = require('lodash');
var PF = require('pathfinding');

/** @type {LoggerInstance} */
var Logger = require('./logger');
var Constants = require('./constants');
/**#@-*/

/**
 * Level class constructor.
 *
 * @param   {String}  player  Name of the current player
 * @constructor
 */
function Level(player) {
  //Logger.silly('Level class initialized.', JSON.stringify(arguments));

  var _this = this;

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
  _this.algorithm = '';
  _this.heuristic = '';
  _this.predictedMoves = [];
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
  //Logger.silly('Entering to \'setGrid()\' method.', JSON.stringify(data));

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
    player.winning = false;

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
Level.prototype.setApple = function setApple(data) {
  //Logger.silly('Entering to \'setApple()\' method.', JSON.stringify(data));

  var _this = this;

  Logger.info('Got new apple', JSON.stringify(data));

  // And for fun, let's get random algorithm and heuristic for this round!
  _this.algorithm = Constants.algorithms[Math.floor(Math.random() * Constants.algorithms.length)];
  _this.heuristic = Constants.heuristics[Math.floor(Math.random() * Constants.heuristics.length)];

  // Reset winning information
  for (var i = 0; i < _this.players.length; i++) {
    _this.players[i].winning = false;
  }

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
 *    growLength: number,
 *    path: [number, number][],
 *    pathTime: number,
 *    previousGrowLength: number,
 *    winning: boolean,
 *    name: string
 *  }[],
 *  timeLeft: number
 * }} data
 */
Level.prototype.setPlayers = function setPlayers(data) {
  //Logger.silly('Entering to \'setPlayers()\' method.', JSON.stringify(data));

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
      // TODO also remove length of current head to this point, optimize path!
      snake.body.pop();
    }

    return snake.body;
  }));
};

/**
 * Helper method to make reserved points to current grid.
 *
 * @param   {Grid}    grid    Current grid instance
 * @param   {{
 *    alive: boolean,
 *    body: *[],
 *    direction: number,
 *    growLength: number,
 *    path: [number, number][],
 *    pathTime: number,
 *    previousGrowLength: number,
 *    winning: boolean,
 *    name: string
 *  }}                player  Player index number
 */
Level.prototype.setReservedPoints = function setReservedPoints(grid, player) {
  //Logger.silly('Entering to \'setReservedPoints()\' method.', JSON.stringify(arguments));

  var _this = this;

  // Determine 'cost' of level edge points
  var bodyLength = Math.floor(player.body.length / 2);
  var edgeCost = Constants.costs.edge + bodyLength;
  var point;

  // Set cost values to level edges, these are points that Kärmes wants to avoid!
  for (var y = 0; y < _this.height; y++) {
    if (y === 0 || y === _this.height - 1) {
      for (var x = 0; x < _this.width; x++) {
        grid.setWalkableAt(x, y, true, edgeCost);
      }
    } else {
      grid.setWalkableAt(0, y, true, edgeCost);
      grid.setWalkableAt((_this.width - 1), y, true, edgeCost);
    }
  }

  // Make sure that actual apple is always walkable
  grid.setWalkableAt(_this.appleX, _this.appleY, true);

  for (var p = 0; p < _this.predictedMoves.length; p++) {
    point = _this.predictedMoves[p];

    if (point[0] >= 0 && point[0] < _this.width && point[1] >= 0 && point[1] < _this.height) {
      grid.setWalkableAt(_this.predictedMoves[p][0], _this.predictedMoves[p][1], true, Constants.costs.opponent);
    }
  }

  // Iterate each reserved point, these are basically snake bodies
  for (var i = 0; i < _this.reservedPoints.length; i++) {
    point = _this.reservedPoints[i];

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
};

/**
 * Method to 'calculate' opponents predicted moves on level according to current direction movement.
 *
 * @todo should we set _all_ possible directions?
 */
Level.prototype.setPredictedMoves = function setPredictedMoves() {
  //Logger.silly('Entering to \'setPredictedMoves()\' method.');

  var _this = this;
  var moves = [];
  var players = _this.players;

  // Iterate players
  for (var i = 0; i < players.length; i++) {
    var player = players[i];

    // And we have opponent player
    if (i !== _this.playerIndex) {
      // Get opponent current position and direction
      var currentX = player.body[0][0];
      var currentY = player.body[0][1];
      var direction = player.direction;

      switch (direction) {
        // Within these we need to just adjust Y coordinate
        case Constants.directionUp:
        case Constants.directionDown:
          var toY = Constants.directionUp ? currentY + 1 : currentY - 1;

          moves.push([currentX, toY]);
          moves.push([currentX - 1, currentY]);
          moves.push([currentX + 1, currentY]);
          break;
        // Within these we need to just adjust X coordinate
        case Constants.directionRight:
        case Constants.directionLeft:
          var toX = Constants.directionRight ? currentX + 1 : currentX - 1;

          moves.push([toX, currentY]);
          moves.push([currentX, currentY - 1]);
          moves.push([currentX, currentY + 1]);
          break;
      }
    }
  }

  // And store those moves
  _this.predictedMoves = moves;
};

/**
 * Method to calculate path for specified snake to current apple.
 *
 * @param  {{
 *  alive: boolean,
 *  body: *[],
 *  direction: number,
 *  growLength: number,
 *  path: [number, number][],
 *  pathTime: number,
 *  previousGrowLength: number,
 *  winning: boolean
 *  }}                player
 * @param {boolean}   reCalculate
 * @param {function}  next
 */
Level.prototype.calculatePath = function calculatePath(player, reCalculate, next) {
  //Logger.silly('Entering to \'calculatePaths()\' method.', JSON.stringify(arguments));

  var _this = this;

  if (!reCalculate) {
    Logger.info('No need to calculate path for snake: \'' + player.name + '\'.');

    return next(null, player);
  }

  var timeStart = new Date();

  // Initialize grid for path finder
  var grid = new PF.Grid(_this.width, _this.height);

  // Set reserved points to current grid
  // noinspection JSCheckFunctionSignatures
  _this.setReservedPoints(grid, player);

  // Create finder
  var finder = new PF[_this.algorithm]({
    allowDiagonal: false,
    heuristic: PF.Heuristic[_this.heuristic],
    cost: 50
  });

  // Determine start and end positions
  var startX = player.body[0][0];
  var startY = player.body[0][1];
  var endX = _this.appleX;
  var endY = _this.appleY;

  // And calculate path to apple
  var path = finder.findPath(startX, startY, endX, endY, grid);

  // Remove first item from path, this is where snake is right now
  path.shift();

  // Set player data
  player.path = path;
  player.pathTime = new Date() - timeStart;

  Logger.info(
    'New path calculated to apple, length: ' + player.path.length + ' time: ' + player.pathTime + 'ms' +
    ' using ' + _this.algorithm + ' with ' + _this.heuristic
  );

  next(null, player);
};

module.exports = Level;
