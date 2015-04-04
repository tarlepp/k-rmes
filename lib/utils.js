'use strict';

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
  }
};
