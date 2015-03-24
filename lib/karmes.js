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
  Logger.silly('Karmes class initialized.');

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

    if (xFrom !== xTo && direction !== _this.directionRight && direction !== _this.directionLeft) {
      Logger.info('Snake is changing direction to ' +
        _this.directions[(xFrom < xTo) ? _this.directionRight : _this.directionLeft]
      );

      _this.connection.sendMessage({
        msg: 'control',
        data: {
          direction: (xFrom < xTo) ? _this.directionRight : _this.directionLeft
        }
      });
    } else if (yFrom !== yTo && direction !== _this.directionDown && direction !== _this.directionUp) {
      Logger.info('Snake is changing direction to ' +
        _this.directions[(yFrom < yTo) ? _this.directionRight : _this.directionLeft]
      );

      _this.connection.sendMessage({
        msg: 'control',
        data: {
          direction: (yFrom < yTo) ? _this.directionDown : _this.directionUp
        }
      });
    } else {
      Logger.info('Snake is continued to moving to ' + _this.directions[direction]);

      Logger.silly('Weird could not get new direction...', JSON.stringify({
        from: [xFrom, yFrom],
        to: [xTo, yTo],
        direction: _this.directions[direction]
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

  /**
   * Simple helper function to make point string, this is just needed to flatten current reserved points.
   *
   * @param   {[number, number]}  point
   * @returns {string}
   */
  var getPointString = function getPointString(point) {
    return 'x' + point[0].toString() + '-y' + point[1].toString();
  };

  // Get reserved points, normal array of coordinates and 'flatten' array
  var reservedPoints = _this.level.reservedPoints;
  var reservedPointsFlatten = _.map(reservedPoints, getPointString);

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
    return reservedPointsFlatten.indexOf(getPointString(square[0])) === -1;
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
        (reservedPointsFlatten.indexOf(getPointString(coordinates)) !== -1)
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
 */
Karmes.prototype.blockOpponents = function blockOpponents() {
  Logger.silly('Entering to \'blockOpponents()\' method.');

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
      case _this.directionUp:
      case _this.directionDown:
        knightDistance = '';

        if ((_this.level.width  - 1) - knightX > (_this.level.width / 2))


        if (
          (knightY > leperY && leper.direction === _this.directionUp) ||
          (knightY < leperY && leper.direction === _this.directionDown)
        ) {

        }
        break;
      case _this.directionRight:
      case _this.directionLeft:
        if (
          (knightX > leperX && leper.direction === _this.directionRight) ||
          (knightX < leperX && leper.direction === _this.directionLeft)
        ) {

        }
        break;
    }
  }
  */
};

/**
 * Method to calculate snakes paths to apple.
 *
 * @todo  Which snake is winning battle over current apple?
 */
Karmes.prototype.calculatePaths = function calculatePaths() {
  Logger.silly('Entering to \'calculatePaths()\' method.');

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
  Logger.silly('Entering to \'getOpponentsPredictedMovement()\' method.');

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
