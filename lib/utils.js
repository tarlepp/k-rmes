'use strict';

/**
 * Module dependencies.
 *
 * @type {exports}
 */
var Constants = require('./constants');

/**
 * This file contains common utils that Kärmes AI uses.
 *
 * @type {{
 *  getPointString: Function
 * }}
 */
module.exports = {
  /**
   * Returns a random number between min (inclusive) and max (exclusive)
   *
   * @param   {number}  min
   * @param   {number}  max
   * @returns {number}
   */
  getRandomArbitrary: function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  },

  /**
   * Returns a random integer between min (inclusive) and max (inclusive)
   * Using Math.round() will give you a non-uniform distribution!
   *
   * @param   {number}  min
   * @param   {number}  max
   * @returns {number}
   */
  getRandomInt: function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Simple helper function to make point string, this is just needed to flatten current reserved points.
   *
   * @param   {[number, number]}  point
   * @returns {string}
   */
  getPointString: function getPointString(point) {
    return 'x' + point[0].toString() + '-y' + point[1].toString();
  },

  /**
   * Helper function to get possible paths on wall collision situation, return array contains two sets of paths:
   *  1) right OR down
   *  2) left OR up
   *
   * Also note that these paths may contain reserved points at this point.
   *
   * @todo mimic this to also make paths for famous 'panic move'!
   *
   * @param   {number}  positionX Starting X position
   * @param   {number}  positionY Starting Y position
   * @param   {number}  direction See Constants.direction* constants
   * @returns {*[]}
   */
  getWallCollisionPoints: function getWallCollisionPoints(positionX, positionY, direction) {
    // Initialize paths
    var paths = [
      [], // right OR down
      [] // left OR up
    ];

    // Possible position coordinates, basically just four steps to new direction
    var positions = [
      [[1, 2, 3, 4], [0, 0, 0, 0]],
      [[1, 2, 3, 3], [0, 0, 0, 1]],
      [[1, 2, 2, 2], [0, 0, 1, 2]],
      [[1, 2, 2, 3], [0, 0, 1, 1]],
      [[1, 2, 2, 1], [0, 0, 1, 1]],
      [[1, 1, 1, 1], [0, 1, 2, 3]],
      [[1, 1, 2, 3], [0, 1, 1, 1]],
      [[1, 1, 2, 2], [0, 1, 1, 2]],
      [[1, 1, 1, 2], [0, 1, 2, 2]]
    ];

    // Iterate positions X coordinate
    for (var x = 0; x < positions.length; x++) {
      // Determine X coordinate sets
      var positionsX = (direction === Constants.directionUp || direction === Constants.directionDown) ?
        positions[x][0] : positions[x][1]
      ;

      // Determine Y coordinate sets
      var positionsY = (direction === Constants.directionUp || direction === Constants.directionDown) ?
        positions[x][1] : positions[x][0]
      ;

      // Initialize used temp arrays
      var rightOrDown = [];
      var leftOrUp = [];

      // Iterate actual coordinates
      for (var y = 0; y < positionsX.length; y++) {
        // Initialize to X and Y coordinates
        var toX = 0;
        var toY = 0;

        // Determine toX and toY coordinates
        if (direction === Constants.directionUp) {
          toX = positionX + positionsX[y];
          toY = positionY + positionsY[y];
        } else if (direction === Constants.directionRight) {
          toX = positionX - positionsX[y];
          toY = positionY + positionsY[y];
        } else if (direction === Constants.directionDown) {
          toX = positionX + positionsX[y];
          toY = positionY - positionsY[y];
        } else if (direction === Constants.directionLeft) {
          toX = positionX + positionsX[y];
          toY = positionY + positionsY[y];
        }

        // And push coordinates to new arrays
        rightOrDown.push([toX, toY]); // Movement to right or down

        if ((direction === Constants.directionUp || direction === Constants.directionDown)) {
          leftOrUp.push([positionX - positionsX[y], toY]); // Movement to left or up
        } else {
          leftOrUp.push([toX, positionY - positionsY[y]]); // Movement to left or up
        }
      }

      // And push those results to main paths.
      paths[0].push(rightOrDown);
      paths[1].push(leftOrUp);
    }

    return paths;
  }
};
