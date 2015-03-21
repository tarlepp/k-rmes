'use strict';

/**
 * karmes.js
 *
 * This file contains Kärmes class which will handle basically snake moves on the current level.
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
/**#@-*/

/**
 * Constructor of Kärmes class. This class handles actual movement process of snake.
 *
 * @param   {Level}       level       Level instance
 * @param   {Connection}  connection  Connection instance
 * @constructor
 */
function Karmes(level, connection) {
  var self = this;

  // Store used object references
  self.level = level;
  self.connection = connection;

  // Set some used constants
  self.directionUp = 1;
  self.directionDown = 2;
  self.directionLeft = 3;
  self.directionRight = 4;

  // Directions as in clear names
  self.directions = {
    1: 'up',
    2: 'down',
    3: 'left',
    4: 'right'
  };
}

/**
 * Simple method to avoid possible wall collision.
 *
 * @todo: Is this necessary at all?
 *
 * @returns {boolean}
 */
Karmes.prototype.avoidWallCollision = function avoidWallCollision() {
  var _this = this;

  // Determine player information
  var player = _this.level.players[_this.level.playerIndex];
  var posX = player.body[0][0];
  var posY = player.body[0][1];
  var direction = player.direction;

  // Initialize used variables
  var to = [];
  var collision = false;

  switch (direction) {
    case _this.directionUp:
    case _this.directionDown:
      if (posY === 0 || posY === _this.level.height - 1) {
        collision = true;

        if (posX === 0 && direction === _this.directionUp) {
          to = [1, posY];
        } else if (posX === _this.level.width - 1 && direction === _this.directionDown) {
          to = [_this.level.width - 2, posY];
        } else {
          // todo: this not good way to do this...
          to = [posX + 1, posY];
        }
      }
      break;
    case _this.directionLeft:
    case _this.directionRight:
      if (posX === 0 || posX === _this.level.width - 1) {
        collision = true;

        if (posY === 0 && direction === _this.directionLeft) {
          to = [posX, 1];
        } else if (posY === _this.level.height - 1 && direction === _this.directionRight) {
          to = [posX, _this.level.height - 2];
        } else {
          // todo: this not good way to do this...
          to = [posX, posY + 1];
        }
      }
      break;
  }

  if (collision) {
    Logger.warn('Wall collision ahead, trying to avoid that.');

    _this.changeDirection(to);
  }

  return collision;
};

/**
 * Method to make actual snake move according to current position and all other stuff (and note to everyone, this isn't
 * so easy..).
 */
Karmes.prototype.makeMove = function makeMove() {
  var _this = this;

  // Get next step for snake
  var nextStep = _this.level.players[_this.level.playerIndex].path.shift();

  // Oh noes we don't know where to go
  if (_.isEmpty(nextStep)) {
    Logger.warn('Oh noes, I don\'t have route to the apple');
  }

  _this.changeDirection(nextStep);
};

/**
 * Method to change snake direction
 *
 * @param {[number, number]}  coordinates Coordinates where we want to move.
 */
Karmes.prototype.changeDirection = function changeDirection(coordinates) {
  var _this = this;

  // Current position and direction of the snake
  var xFrom = _this.level.players[_this.level.playerIndex].body[0][0];
  var yFrom = _this.level.players[_this.level.playerIndex].body[0][1];
  var direction = _this.level.players[_this.level.playerIndex].direction;

  // Yeah we got coordinates where we want to go
  if (coordinates && coordinates.length === 2) {
    var xTo = coordinates[0];
    var yTo = coordinates[1];

    if (xFrom !== xTo && direction !== _this.directionRight && direction !== _this.directionLeft) {
      _this.connection.sendMessage({
        msg: 'control',
        data: {
          direction: (xFrom < xTo) ? _this.directionRight : _this.directionLeft
        }
      });
    } else if (yFrom !== yTo && direction !== _this.directionDown && direction !== _this.directionUp) {
      _this.connection.sendMessage({
        msg: 'control',
        data: {
          direction: (yFrom < yTo) ? _this.directionDown : _this.directionUp
        }
      });
    } else {
      Logger.silly('Weird could not get new direction...', JSON.stringify({
        from: [xFrom, yFrom],
        to: [xTo, yTo],
        direction: _this.directions[direction]
      }));
    }
  } else {
    Logger.warn('No coordinates, where should we go now?');
  }
};

/**
 * Method to calculate snakes paths to apple.
 *
 * @todo  Which snake is winning battle over current apple?
 */
Karmes.prototype.calculatePaths = function calculatePaths() {
  var _this = this;

  // Determine opponents predicted movements
  var opponentsMovements = _this.getOpponentsPredictedMovement();

  // Iterate each player
  _.forEach(_this.level.players, function iterator(player, index) {
    var timeStart = new Date();

    // Initialize grid for path finder
    var grid = new PF.Grid(_this.level.width, _this.level.height);

    // Set reserved points to current grid
    // noinspection JSCheckFunctionSignatures
    _this.level.setReservedPoints(grid, opponentsMovements, index);

    // Create finder, todo should we use some config for used algo?
    var finder = new PF.DijkstraFinder({
      allowDiagonal: false,
      heuristic: PF.Heuristic.octile
    });

    // Determine start and end positions
    var startX = player.body[0][0];
    var startY = player.body[0][1];
    var endX = _this.level.appleX;
    var endY = _this.level.appleY;

    // And calculate path to apple
    var path = finder.findPath(startX, startY, endX, endY, grid);

    // Remove first item from path, this is where snake is right now
    path.shift();

    // Set player data
    player.path = path;
    player.pathTime = new Date() - timeStart;

    Logger.info(
      'Player \'' + player.name + '\' path length is ' + path.length +
      ', calculation done in ' + player.pathTime + 'ms'
    );
  });
};

/**
 * Method to get opponent snakes "next" direction, this is needed to avoid collision to opponent snake. Basically this
 * will just iterate all players and "guess" their next position on current direction, not flawless but close enough :D
 *
 * @returns {Array}
 */
Karmes.prototype.getOpponentsPredictedMovement = function getOpponentsPredictedMovement() {
  var _this = this;
  var output = [];
  var players = _this.level.players;

  // Iterate players
  for (var i = 0; i < players.length; i++) {
    var player = players[i];

    // And we have opponent player
    if (i !== _this.level.playerIndex) {
      // Get opponent current position and direction
      var currentX = player.body[0][0];
      var currentY = player.body[0][1];
      var direction = player.direction;

      // Initialize coordinates
      var coordinates = [];

      switch (direction) {
        // Within these we need to just adjust Y coordinate
        case _this.directionUp:
        case _this.directionDown:
          var toY = _this.directionUp ? currentY + 1 : currentY - 1;

          coordinates = [currentX, toY];
          break;
        // Within these we need to just adjust X coordinate
        case _this.directionRight:
        case _this.directionLeft:
          var toX = _this.directionRight ? currentX + 1 : currentX - 1;

          coordinates = [toX, currentY];
          break;
      }

      output.push(coordinates);
    }
  }

  return output;
};

module.exports = Karmes;
