'use strict';

/**
 * karmes.js
 *
 * This file contains Kärmes class which will handle basically main 'moves' of Kärmes. This class contains multiple
 * different maneuvers that kärmes will do in different situations.
 */

/**#@+
 * Module dependencies
 *
 * @type {exports}
 */
var _ = require('lodash');
var async = require('async');

/** @type {LoggerInstance} */
var Logger = require('./logger');
var Constants = require('./constants');
var Utils = require('./utils');
/**#@-*/

/**
 * Constructor of Kärmes class. This class handles actual movement process of snake.
 *
 * @param   {Level} level Level instance
 * @param   {Game}  game  Connection instance
 * @constructor
 */
function Karmes(level, game) {
  //Logger.silly('Karmes class initialized.');

  var self = this;

  // Store used object references
  self.level = level;
  self.game = game;
}

/**
 * Main method on Kärmes class, this is called from Handler whenever new position message is got from server. Basically
 * this contains all the logic for Kärmes movements; attacks, blocks and actual path find.
 *
 * Note that all jobs are done in main async waterfall job, and if those jobs calls callback function with 'error'
 * parameter (first parameter on callback) that means that current job has already handled necessary movements.
 *
 * @param {function}  next  Callback function which is called when all jobs are done
 */
Karmes.prototype.doStuff = function doStuff(next) {
  var _this = this;

  async.series(
    [
      // Defense: Avoid wall collision, this is not needed - maybe
      //function(callback) {
      //  _this.avoidWallCollision(callback);
      //},

      // Defense: Avoid reserved points, this is not needed - maybe
      //function(callback) {
      //  _this.avoidReservedPoints(callback);
      //},

      // Defense: Avoid apple that cannot be eaten
      function(callback) {
        _this._avoidRottenApple(callback);
      },

      // Offense: block opponents, this is really needed :D
      //function(callback) {
      //  _this.blockOpponents(callback);
      //},

      // Offense: apple siege!
      //function(callback) {
      //  _this.appleSiege(callback);
      //},

      // Routine: calculate paths to apple, if that is needed
      function(callback) {
        _this.level.calculatePath(_this.level.players[_this.level.playerIndex], true, callback);
      }
    ],
    function callback(error) {
      if (error) {
        Logger.info('Move already made, more info. ', JSON.stringify(error));
      } else {
        _this._makeMove();
      }

      next(null, null);
    }
  );
};

/**
 * Simple method to avoid 'rotten' apple on map. This is to avoid some special cases.
 *
 * @param {function}  next
 * @private
 */
Karmes.prototype._avoidRottenApple = function _avoidRottenApple(next) {
  var _this = this;

  // Initialize used variables
  var player = _this.level.players[_this.level.playerIndex];
  var positionX = player.body[0][0];
  var positionY = player.body[0][1];
  var appleX = _this.level.appleX;
  var appleY = _this.level.appleY;
  var levelWidth = _this.level.width;
  var levelHeight = _this.level.height;

  // Make flatten reserved points
  var reservedPointsFlatten = _.map(_this.level.reservedPoints, Utils.getPointString);

  // Possible entry points for apple
  var entryPoints = [
    [appleX, appleY - 1],
    [appleX + 1, appleY],
    [appleX, appleY + 1],
    [appleX - 1, appleY]
  ];

  // Remove illegal entry points
  _.remove(entryPoints, function iterator(point) {
    if (point[0] === positionX && point[1] === positionY) { // Do not count Kärmes itself as a rotten point :D
      return false;
    } else if (point[0] < 0 || point[0] >= levelWidth ||
      point[1] < 0 || point[1] >= levelHeight ||
      (reservedPointsFlatten.indexOf(Utils.getPointString(point)) !== -1)
    ) {
      return true;
    }
  });

  // This apple is 'rotten' there is no way to get that apple and get to the safety there.
  if (entryPoints.length === 0 || entryPoints.length === 1) {
    _this._changeDirection();

    next('avoidRottenApple triggered', null);
  } else {
    next(null, null);
  }
};

/**
 * Method to check if snake can block current opponent(s). Eg in case that is shown below snake A should block snake B
 * so that he will lose whole game (also note that snakes are going upwards in this scenario).
 *
 * [0 0 0 0 0 0 0 0]
 * [0 0 0 0 0 0 0 0]
 * [0 0 0 0 0 0 A 0]
 * [0 0 0 0 0 0 A 0]
 * [0 0 0 0 0 0 A B]
 * [0 0 0 0 0 0 A B]
 * [0 0 0 0 0 0 0 B]
 * [0 0 0 0 0 0 0 0]
 *
 * Basically kärmes should always try to block opponent if that is possible.
 *
 * todo: This will need some heavy coding to do.
 * todo: use similar logic that Ajaska on this, his algo is nice, really nice
 *
 * @param {function}  next
 * @private
 */
Karmes.prototype._blockOpponents = function _blockOpponents(next) {
  //Logger.silly('Entering to \'blockOpponents()\' method.');

  next(null, null);
};

/**
 * Defense method to avoid possible wall collision.
 *
 * @todo Check if there is path already, if yes use that please!
 *
 * @param {function}  next
 * @private
 */
Karmes.prototype._avoidWallCollision = function _avoidWallCollision(next) {
  //Logger.silly('Entering to \'avoidWallCollision()\' method.');

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
    case Constants.directionUp:
    case Constants.directionDown:
      if (posY === 0 || posY === _this.level.height - 1) {
        collision = true;

        if (posX === 0) { // Only path is to right
          to = [1, posY];
        } else if (posX === _this.level.width - 1) { // Only path is to left
          to = [_this.level.width - 2, posY];
        }
      }
      break;
    case Constants.directionLeft:
    case Constants.directionRight:
      if (posX === 0 || posX === _this.level.width - 1) {
        collision = true;

        if (posY === 0) { // Only path is to down
          to = [posX, 1];
        } else if (posY === _this.level.height - 1) { // Only path is to up
          to = [posX, _this.level.height - 2];
        }
      }
      break;
  }

  var message = null;

  if (collision) {
    if (to.length === 0) {
      // Determine possible 'good' paths
      var paths = Utils.getWallCollisionPoints(posX, posY, direction);

      // We have more choices on right OR down side
      if (paths[0].length > paths[1].length) {
        to = paths[0][0][0];
      } else if (paths[0].length < paths[1].length) { // We have more choices on left OR up side
        to = paths[1][0][0];
      } else if (paths[0].length === paths[1].length && paths[0].length > 0) { // Both 'sides' are good, use random :D
        to = paths[Utils.getRandomInt(0, 1)][0][0];
      }
    }

    message = 'Wall collision ahead, trying to avoid that.';

    Logger.warn(message);

    _this._changeDirection(to);
  }

  next(message, null);
};

/**
 * Method to avoid reserved points.
 *
 * @todo implement this...
 * @todo is this needed?
 * @todo check if path exists
 *
 * @param {function}  next
 * @private
 */
Karmes.prototype._avoidReservedPoints = function _avoidReservedPoints(next) {
  //Logger.silly('Entering to \'avoidWallCollision()\' method.');

  next(null, null);
};

/**
 * Method to siege current apple. Following conditions must be met in this offense move:
 *  1) My snake is longer than opponent(s)
 *  2) I can make a circle around the current apple before opponent gets it
 *
 * @todo implement this...
 *
 * @param {function}  next
 * @private
 */
Karmes.prototype._appleSiege = function _appleSiege(next) {
  //Logger.silly('Entering to \'appleSiege()\' method.');

  next(null, null);
};

/**
 * Method to make actual snake move according to current position and all other stuff (and note to everyone, this isn't
 * so easy..).
 *
 * @private
 */
Karmes.prototype._makeMove = function _makeMove() {
  //Logger.silly('Entering to \'makeMove()\' method.');

  var _this = this;

  // Get next step for snake
  var nextStep = _this.level.players[_this.level.playerIndex].path.shift();

  // Oh noes we don't know where to go
  if (_.isEmpty(nextStep)) {
    Logger.warn('Oh noes, I don\'t have route to the apple');
  }

  Logger.info('Making move to next position!', JSON.stringify(nextStep));

  _this._changeDirection(nextStep);
};

/**
 * Method to change snake direction
 *
 * @param {[number, number]}  [coordinates] Coordinates where we want to move.
 * @private
 */
Karmes.prototype._changeDirection = function _changeDirection(coordinates) {
  //Logger.silly('Entering to \'changeDirection()\' method.', JSON.stringify(arguments));

  var _this = this;

  // Current position and direction of the snake
  var xFrom = _this.level.players[_this.level.playerIndex].body[0][0];
  var yFrom = _this.level.players[_this.level.playerIndex].body[0][1];
  var direction = _this.level.players[_this.level.playerIndex].direction;

  if (!(coordinates && coordinates.length === 2)) {
    coordinates = _this._getPanicMove();
  }

  // Yeah we got coordinates where we want to go
  if (coordinates && coordinates.length === 2) {
    var xTo = coordinates[0];
    var yTo = coordinates[1];

    if (xFrom !== xTo && direction !== Constants.directionRight && direction !== Constants.directionLeft) {
      Logger.info('Snake is changing direction to ' +
        Constants.directions[(xFrom < xTo) ? Constants.directionRight : Constants.directionLeft]
      );

      _this.game.sendMessage({
        msg: 'control',
        data: {
          direction: (xFrom < xTo) ? Constants.directionRight : Constants.directionLeft
        }
      });
    } else if (yFrom !== yTo && direction !== Constants.directionDown && direction !== Constants.directionUp) {
      Logger.info('Snake is changing direction to ' +
        Constants.directions[(yFrom < yTo) ? Constants.directionRight : Constants.directionLeft]
      );

      _this.game.sendMessage({
        msg: 'control',
        data: {
          direction: (yFrom < yTo) ? Constants.directionDown : Constants.directionUp
        }
      });
    } else {
      Logger.info('Snake is continues to moving to ' + Constants.directions[direction]);

      /*
      Logger.silly('Weird could not get new direction...', JSON.stringify({
        from: [xFrom, yFrom],
        to: [xTo, yTo],
        direction: Constants.directions[direction]
      }));
      */
    }
  } else {
    Logger.warn('No coordinates, this isn\'t good.');
  }
};

/**
 * Method to make 'panic move' this is initialized every time when there's no route to apple. Basically this logic
 * calculates 2x3 and 3x2 tiles from current position and checks which one contains most "free" spots.
 *
 * @todo This needs some work still, it isn't taking all spots right now, and that isn't good. REALLY this isn't good...
 *
 * @return  {[number, number]}
 * @private
 */
Karmes.prototype._getPanicMove = function _panicMove() {
  //Logger.silly('Entering to \'getPanicMove()\' method.', JSON.stringify(arguments));

  var _this = this;

  Logger.error('Yeah, panic move!');

  // Player snake
  var snake = _this.level.players[_this.level.playerIndex];

  // Current position and direction of the snake
  var xFrom = snake.body[0][0];
  var yFrom = snake.body[0][1];

  // Determine level width and height
  var levelWidth = _this.level.width;
  var levelHeight = _this.level.height;

  // Get reserved points, normal array of coordinates and 'flatten' array
  var reservedPoints = _this.level.reservedPoints;
  var reservedPointsFlatten = _.map(reservedPoints, _this.getPointString);

  // Create 'squares' for each direction; top, right, bottom and left
  var squares = [
    [ // top
      [xFrom, yFrom + 1],
      [xFrom - 1, yFrom + 1],
      [xFrom - 1, yFrom + 2],
      [xFrom, yFrom + 2],
      [xFrom + 1, yFrom + 2],
      [xFrom + 1, yFrom + 1]
    ],
    [ // right
      [xFrom + 1, yFrom],
      [xFrom + 1, yFrom + 1],
      [xFrom + 2, yFrom + 1],
      [xFrom + 2, yFrom],
      [xFrom + 2, yFrom - 1],
      [xFrom + 1, yFrom - 1]
    ],
    [ // bottom
      [xFrom, yFrom - 1],
      [xFrom + 1, yFrom - 1],
      [xFrom + 1, yFrom - 2],
      [xFrom, yFrom - 2],
      [xFrom - 1, yFrom -2],
      [xFrom - 1, yFrom - 1]
    ],
    [ // left
      [xFrom - 1, yFrom],
      [xFrom - 1, yFrom - 1],
      [xFrom - 2, yFrom - 1],
      [xFrom - 2, yFrom],
      [xFrom - 2, yFrom + 1],
      [xFrom - 1, yFrom + 1]
    ]
  ];

  // Remove all 'first' possible path from squares, this is to remove 'not possible' square
  squares = _.remove(squares, function iterator(square) {
    return reservedPointsFlatten.indexOf(_this.getPointString(square[0])) === -1;
  });

  // Check each squares that we have some coordinates to go to
  squares = _.map(squares, function iterator(square) {
    // Remove not possible coordinates
    square = _.map(square, function iterator(coordinates) {
      var x = coordinates[0];
      var y = coordinates[1];

      // Oh noes, coordinates are not allowed
      if (
        (x < 0 || x >= levelWidth) ||
        (y < 0 || y >= levelHeight) ||
        (reservedPointsFlatten.indexOf(_this.getPointString(coordinates)) !== -1)
      ) {
        return false;
      }

      return coordinates;
    });

    return _.compact(square);
  });

  // Sort squares by it length => more available spots
  squares.sort(function sorter(a, b) {
    return b.length - a.length;
  });

  Logger.error('panic data', JSON.stringify(squares));

  return squares[0][0];
};

module.exports = Karmes;
