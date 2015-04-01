'use strict';

/**
 * This file contains all used constants that Kärmes bot uses.
 *
 * @type {{
 *  directionUp: number,
 *  directionDown: number,
 *  directionLeft: number,
 *  directionRight: number,
 *  directions: {
 *    1: string,
 *    2: string,
 *    3: string,
 *    4: string
 *  }
 * }}
 */
module.exports = {
  // Direction values
  directionUp: 1,
  directionDown: 2,
  directionLeft: 3,
  directionRight: 4,

  // And human readable directions
  directions: {
    1: 'up',
    2: 'down',
    3: 'left',
    4: 'right'
  }
};
