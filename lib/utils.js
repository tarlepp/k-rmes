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
   * Simple helper function to make point string, this is just needed to flatten current reserved points.
   *
   * @param   {[number, number]}  point
   * @returns {string}
   */
  getPointString: function getPointString(point) {
    return 'x' + point[0].toString() + '-y' + point[1].toString();
  },

  getWallCollisionPoints: function getWallCollisionPoints(posX, posY, direction) {
    var paths = [];

    if (direction === Constants.directionUp || direction === Constants.directionDown) {
      var positions = [
        [[-1, -2, -3, -4], [0, 0, 0, 0]],
        [[-1, -2, -3, -3], [0, 0, 0, 1]],
        [[-1, -2, -2, -2], [0, 0, 1, 2]],
        [[-1, -2, -2, -3], [0, 0, 1, 1]],
        [[-1, -2, -2, -1], [0, 0, 1, 1]],
        [[-1, -1, -1, -1], [0, 1, 2, 3]],
        [[-1, -1, -2, -3], [0, 1, 1, 1]],
        [[-1, -1, -2, -2], [0, 1, 1, 2]],
        [[-1, -1, -1, -2], [0, 1, 2, 2]]
      ];

      var paths2 = [];

      for (var i = 0; i < positions.length; i++) {
        var positionsX = positions[i][0];
        var positionsY = positions[i][1];

        for (var x = 0; x < positionsX.length; x++) {

        }
      }
    }







    paths.push(
      [posX - 1, posY],
      [posX - 2, posY],
      [posX - 3, posY],
      [posX - 4, posY]
    );

    paths.push(
      [posX - 1, posY],
      [posX - 2, posY],
      [posX - 3, posY],
      [posX - 3, posY + 1]
    );

    paths.push(
      [posX - 1, posY],
      [posX - 2, posY],
      [posX - 2, posY + 1],
      [posX - 2, posY + 2]
    );

    paths.push(
      [posX - 1, posY],
      [posX - 2, posY],
      [posX - 2, posY + 1],
      [posX - 3, posY + 1]
    );

    paths.push(
      [posX - 1, posY],
      [posX - 2, posY],
      [posX - 2, posY + 1],
      [posX - 1, posY + 1]
    );

    paths.push(
      [posX - 1, posY],
      [posX - 1, posY + 1],
      [posX - 1, posY + 2],
      [posX - 1, posY + 3]
    );

    paths.push(
      [posX - 1, posY],
      [posX - 1, posY + 1],
      [posX - 2, posY + 1],
      [posX - 3, posY + 1]
    );

    paths.push(
      [posX - 1, posY],
      [posX - 1, posY + 1],
      [posX - 2, posY + 1],
      [posX - 2, posY + 2]
    );

    paths.push(
      [posX - 1, posY],
      [posX - 1, posY + 1],
      [posX - 1, posY + 2],
      [posX - 2, posY + 2]
    );
  }
};
