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
/**#@-*/

/**
 * Constructor of Kärmes class. This class handles actual movement process of snake.
 *
 * @param   {Level}       level       Level instance
 * @param   {Connection}  connection  Connection instance
 * @constructor
 */
function Karmes(level, connection) {
  Logger.silly('Karmes class initialized.');

  var self = this;

  // Store used object references
  self.level = level;
  self.connection = connection;
}

/**
 * Main method on Kärmes class, this is called from Handler whenever new position message is got from server. Basically
 * this contains all the logic for Kärmes movements; attacks, blocks and actual path find.
 *
 * Note that all jobs are done in main async waterfall job, and if those jobs calls callback function with 'error'
 * parameter (first parameter on callback) that means that current job has already handled necessary movements.
 */
Karmes.prototype.doStuff = function doStuff(next) {
  var _this = this;

  async.waterfall(
    [
      /**#@+
       * Not yet implemented features, note that some of these might be just a waste of time...
       */
      // Defense: Avoid wall collision, this is not needed - maybe
      //function(callback) {
      //  _this.avoidWallCollision(callback);
      //},

      // Defense: Avoid reserved points, this is not needed - maybe
      //function(arg1, callback) {
      //  _this.avoidReservedPoints(callback);
      //},

      // Offense: block opponents, this is really needed :D
      //function(arg1, callback) {
      //  _this.blockOpponents(callback);
      //},
      /**#@-*/

      // Routine: calculate paths to apple, if that is needed
      function(callback) {
        var players = _this.level.players;

        var minRoute = _.min(_.map(players, function iterator(player) {
          return player.path.length;
        }));

        var needToCalculate = true;

        if (players[_this.level.playerIndex].path.length <= minRoute &&
          players[_this.level.playerIndex].path.length !== 0
        ) {
          needToCalculate = false;
        }

        _this.calculatePaths(needToCalculate, callback);
      },
      // Routine: to determine if we need to calculate new path to "somewhere" if i'm not winning
      function(players, callback) {
        var minRoute = _.min(_.map(players, function iterator(player) {
          return player.path.length;
        }));

        players[_this.level.playerIndex].winning = players[_this.level.playerIndex].path.length < minRoute;

        // Todo if i'm not winning make another move...

        callback(null, null);
      }
    ],
    function callback(error) {
      if (error) {
        Logger.info('Move already made, more info. ', JSON.stringify(error));
      } else {
        _this.makeMove();
      }

      next(null, null);
    }
  );
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
 * todo: This will need some heavy coding to do.
 * todo: use similar logic that Ajaska on this, his algo is nice, really nice
 */
Karmes.prototype.blockOpponents = function blockOpponents(next) {
  Logger.silly('Entering to \'blockOpponents()\' method.');

  next(null, null);

  /*
   var _this = this;

   var knight = _this.level.players[_this.level.playerIndex];
   var players = _this.level.players;

   // Set knight direction and coordinates
   var knightDirection = knight.direction;
   var knightX = knight.body[0][0];
   var knightY = knight.body[0][1];

   var canBlock = false;

   // Iterate players
   for (var i = 0; i < players.length; i++) {
   if (i === _this.level.playerIndex) {
   continue;
   }

   // Set leper, damn this leper we're going to try to destroy it, bhuahahhaaaa!!
   var leper = players[i];

   // Set leper direction and coordinates
   var leperDirection = leper.direction;
   var leperX = leper.body[0][0];
   var leperY = leper.body[0][1];

   // Ok, we are going to same direction, nice
   if (knightDirection !== leperDirection) {
   continue;
   }

   var knightDistance = 0;
   var leperDistance = 0;

   switch (leper.direction) {
   case Constants.directionUp:
   case Constants.directionDown:
   knightDistance = '';

   if ((_this.level.width  - 1) - knightX > (_this.level.width / 2))


   if (
   (knightY > leperY && leper.direction === Constants.directionUp) ||
   (knightY < leperY && leper.direction === Constants.directionDown)
   ) {

   }
   break;
   case Constants.directionRight:
   case Constants.directionLeft:
   if (
   (knightX > leperX && leper.direction === Constants.directionRight) ||
   (knightX < leperX && leper.direction === Constants.directionLeft)
   ) {

   }
   break;
   }
   }
   */
};

/**
 * Method to calculate paths to next apple.
 *
 * @param {function}  next
 */
Karmes.prototype.calculatePaths = function calculatePaths(needToCalculate, next) {
  var _this = this;

  async.map(
    _this.level.players,
    function iterator(player, callback) {
      _this.level.calculatePaths(player, needToCalculate, callback);
    },
    next
  );
};

/**
 * Simple method to avoid possible wall collision.
 *
 * @todo: Is this necessary at all?
 *
 * @returns {boolean}
 */
Karmes.prototype.avoidWallCollision = function avoidWallCollision(next) {
  Logger.silly('Entering to \'avoidWallCollision()\' method.');

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

        if (posX === 0 && direction === Constants.directionUp) {
          to = [1, posY];
        } else if (posX === _this.level.width - 1 && direction === Constants.directionDown) {
          to = [_this.level.width - 2, posY];
        } else {
          // todo: this not good way to do this...
          to = [posX + 1, posY];
        }
      }
      break;
    case Constants.directionLeft:
    case Constants.directionRight:
      if (posX === 0 || posX === _this.level.width - 1) {
        collision = true;

        if (posY === 0 && direction === Constants.directionLeft) {
          to = [posX, 1];
        } else if (posY === _this.level.height - 1 && direction === Constants.directionRight) {
          to = [posX, _this.level.height - 2];
        } else {
          // todo: this not good way to do this...
          to = [posX, posY + 1];
        }
      }
      break;
  }

  var message = null;

  if (collision) {
    message = 'Wall collision ahead, trying to avoid that.';

    Logger.warn(message);

    _this.changeDirection(to);
  }

  next(message, null);
};

/**
 * Method to avoid reserved points.
 *
 * @param   {function}  next
 */
Karmes.prototype.avoidReservedPoints = function avoidReservedPoints(next) {
  Logger.silly('Entering to \'avoidWallCollision()\' method.');

  var _this = this;

  // Determine player information
  var player = _this.level.players[_this.level.playerIndex];
  var posX = player.body[0][0];
  var posY = player.body[0][1];
  var direction = player.direction;
  var to = [];
  var toOnCollision = [];

  switch (direction) {
    case Constants.directionUp:
    case Constants.directionDown:
      var toY = (direction === Constants.directionUp) ? (posY - 1) : (posY + 1);

      to = [posX, toY];

      toOnCollision.push([posX - 1, posY]);
      toOnCollision.push([posX + 1, posY]);
      break;
    case Constants.directionLeft:
    case Constants.directionRight:
      var toX = (direction === Constants.directionLeft) ? (posX - 1) : (posX + 1);

      to = [toX, posY];

      toOnCollision.push([posX, posY - 1]);
      toOnCollision.push([posX, posY + 1]);
      break;
  }

  // Get reserved points, normal array of coordinates and 'flatten' array
  var reservedPoints = _this.level.reservedPoints;
  var reservedPointsFlatten = _.map(reservedPoints, _this.getPointString);

  if (reservedPointsFlatten.indexOf(_this.getPointString(to)) !== -1) {
    Logger.error('oh noes');
    Logger.error('oh noes collision!!!');
    Logger.error(reservedPointsFlatten);
    Logger.error(_this.getPointString(to));
    Logger.error(toOnCollision);
    Logger.error('oh noes');
  }

  next(null, null);
};

/**
 * Method to make actual snake move according to current position and all other stuff (and note to everyone, this isn't
 * so easy..).
 */
Karmes.prototype.makeMove = function makeMove() {
  Logger.silly('Entering to \'makeMove()\' method.');

  var _this = this;

  // Get next step for snake
  var nextStep = _this.level.players[_this.level.playerIndex].path.shift();

  // Oh noes we don't know where to go
  if (_.isEmpty(nextStep)) {
    Logger.warn('Oh noes, I don\'t have route to the apple');
  }

  Logger.info('Making move to next position!', JSON.stringify(nextStep));

  _this.changeDirection(nextStep);
};

/**
 * Method to change snake direction
 *
 * @param {[number, number]}  coordinates Coordinates where we want to move.
 */
Karmes.prototype.changeDirection = function changeDirection(coordinates) {
  Logger.silly('Entering to \'changeDirection()\' method.', JSON.stringify(arguments));

  var _this = this;

  // Current position and direction of the snake
  var xFrom = _this.level.players[_this.level.playerIndex].body[0][0];
  var yFrom = _this.level.players[_this.level.playerIndex].body[0][1];
  var direction = _this.level.players[_this.level.playerIndex].direction;

  if (!(coordinates && coordinates.length === 2)) {
    coordinates = _this.getPanicMove();
  }

  // Yeah we got coordinates where we want to go
  if (coordinates && coordinates.length === 2) {
    var xTo = coordinates[0];
    var yTo = coordinates[1];

    if (xFrom !== xTo && direction !== Constants.directionRight && direction !== Constants.directionLeft) {
      Logger.info('Snake is changing direction to ' +
        Constants.directions[(xFrom < xTo) ? Constants.directionRight : Constants.directionLeft]
      );

      _this.connection.sendMessage({
        msg: 'control',
        data: {
          direction: (xFrom < xTo) ? Constants.directionRight : Constants.directionLeft
        }
      });
    } else if (yFrom !== yTo && direction !== Constants.directionDown && direction !== Constants.directionUp) {
      Logger.info('Snake is changing direction to ' +
        Constants.directions[(yFrom < yTo) ? Constants.directionRight : Constants.directionLeft]
      );

      _this.connection.sendMessage({
        msg: 'control',
        data: {
          direction: (yFrom < yTo) ? Constants.directionDown : Constants.directionUp
        }
      });
    } else {
      Logger.info('Snake is continues to moving to ' + Constants.directions[direction]);

      Logger.silly('Weird could not get new direction...', JSON.stringify({
        from: [xFrom, yFrom],
        to: [xTo, yTo],
        direction: Constants.directions[direction]
      }));
    }
  } else {
    Logger.warn('No coordinates, this isn\'t good.');
  }
};

/**
 * Method to make 'panic move' this is initialized every time when there's no route to apple. Basically this logic
 * calculates 2x3 and 3x2 tiles from current position and checks which one contains most "free" spots.
 *
 * @todo  This needs some work still, it isn't taking all spots right now, and that isn't good.
 *
 * @return  {[number, number]}
 */
Karmes.prototype.getPanicMove = function panicMove() {
  Logger.silly('Entering to \'getPanicMove()\' method.', JSON.stringify(arguments));

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

/**
 * Simple helper function to make point string, this is just needed to flatten current reserved points.
 *
 * @param   {[number, number]}  point
 * @returns {string}
 */
Karmes.prototype.getPointString = function getPointString(point) {
  return 'x' + point[0].toString() + '-y' + point[1].toString();
};

module.exports = Karmes;
