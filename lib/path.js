'use strict';

/**
 * path.js
 *
 * This file contains all necessary path calculation methods to get "shortest" path from point A to point B. Basically
 * this uses two different 3rd party libraries for calculation:
 *
 *  - EasyStar.js (https://github.com/prettymuchbryce/easystarjs)
 *  - node-pathfinder (https://github.com/Ezelia/node-pathfinder)
 *
 * Haven't decide yet which one is "better", both uses A* algorithm for actual path calculation with small differences.
 */

/**#@+
 * Module dependencies
 *
 * @type {exports}
 */
var EasyStar = require('easystarjs');
// noinspection JSUnresolvedVariable
var pathfinder = require('node-pathfinder').AStarJPS;
var _ = require('lodash');
var bluebird = require('bluebird');

/** @type {LoggerInstance} */
var Logger = require('./logger');
/**#@-*/

module.exports = {
  /**
   * Method to find path from defined point (x, y) to another point (x, y) according to given grid. Note that this
   * method work with callback function (this means that it's async). Main callback function get 'route' argument which
   * can be an array or boolean false. False value means that there isn't route to desired point.
   *
   * This uses EasyStar.js library for path calculation.
   *
   * @param   {number}    startX  Start point X coordinate
   * @param   {number}    startY  Start point y coordinate
   * @param   {number}    endX    End point X coordinate
   * @param   {number}    endY    End point y coordinate
   * @param   {*[]}       grid    Grid data
   * @param   {function}  next    Callback function to call after calculation are done
   */
  findEasyStar: function findEasyStar(startX, startY, endX, endY, grid, next) {
    // noinspection JSUnresolvedFunction, JSPotentiallyInvalidConstructorUsage
    var easyPath = new EasyStar.js();

    Logger.silly('Path.findEasyStar called.', JSON.stringify(arguments));

    /**
     * Callback function that method uses to format route data plain array and after that call main next function with
     * calculated results.
     *
     * @param   {{x: number, y: number}[]|null} route
     * @returns {[number, number][]|boolean}
     */
    var callback = function callback(route) {
      if (route === null) {
        Logger.warn('Route not found to apple', JSON.stringify([[startX, startY], [endX, endY]]));

        return next(false);
      }

      // Normalize results
      return next(_.map(route, function iterator(coordinates) {
        return [coordinates.x, coordinates.y];
      }));
    };

    try {
      easyPath.setGrid(_.clone(grid));
      easyPath.setAcceptableTiles([0]);
      easyPath.findPath(startX, startY, endX, endY, callback);
      easyPath.calculate();
    } catch (error) {
      Logger.error('Path calculation error', JSON.stringify(error));

      callback(null);
    }
  },
  /**
   * Method that uses EasyStar.js library for path calculation. Main difference against 'findEasyStar' method is that
   * this will return a promise.
   *
   * @param   {number}    startX  Start point X coordinate
   * @param   {number}    startY  Start point y coordinate
   * @param   {number}    endX    End point X coordinate
   * @param   {number}    endY    End point y coordinate
   * @param   {*[]}       grid    Grid data
   *
   * @returns {Promise}
   */
  findEasyStarPromise: function findEasyStarPromise(startX, startY, endX, endY, grid) {
    var self = this;
    var resolver = bluebird.defer();

    Logger.silly('Path.findEasyStarPromise called.', JSON.stringify(arguments));

    /**
     * Callback function that contains promise resolve.
     *
     * @param {[number, number][]|boolean}  route
     */
    var callback = function callback(route) {
      resolver.resolve(route);
    };

    // And calculate that path!
    self.findEasyStar(startX, startY, endX, endY, grid, callback);

    return resolver.promise;
  },
  /**
   * Method to find path to specified point using 'node-pathfinder' library. This library is really fast, I mean really
   * really fast, but it uses diagonal calculations so there is some extra work to get this work. Also note that this
   * method is blocking.
   *
   * @param   {number}    startX  Start point X coordinate
   * @param   {number}    startY  Start point y coordinate
   * @param   {number}    endX    End point X coordinate
   * @param   {number}    endY    End point y coordinate
   * @param   {*[]}       grid    Grid data
   *
   * @returns {*[]}
   */
  findAStar: function findAStar(startX, startY, endX, endY, grid) {
    Logger.silly('Path.findAStar called.', JSON.stringify(arguments));

    return pathfinder(grid, startX, startY, endX, endY);
  },
  /**
   * Method to promisify 'node-pathfinder' library usage.
   *
   * @param   {number}    startX  Start point X coordinate
   * @param   {number}    startY  Start point y coordinate
   * @param   {number}    endX    End point X coordinate
   * @param   {number}    endY    End point y coordinate
   * @param   {*[]}       grid    Grid data
   *
   * @returns {Promise}
   */
  findAStarPromise: function findAStarPromise(startX, startY, endX, endY, grid) {
    var self = this;

    Logger.silly('Path.findAStarPromise called.', JSON.stringify(arguments));

    return new bluebird(function callback(resolve) {
      resolve(self.findAStar(startX, startY, endX, endY, grid));
    });
  }
};
