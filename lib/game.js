'use strict';

/**
 * connection.js
 *
 * This file contains all logic to communicate between specified server.
 *
 * Usage example:
 *  var Game = require('./game');
 *
 *  new Game('host', 'port', 'player');
 *
 * After this you have made connection to specified server and actually start playing the game, I hope that you win!
 */

/**#@+
 * Module dependencies
 *
 * @type {exports}
 */
var net = require('net');

/** @type {Handler} */
var Handler = require('./handler');

/** @type {LoggerInstance} */
var Logger = require('./logger');
/**#@-*/

/**
 * Game class constructor. This class contains all necessary methods to communicate between server. This class
 * contains only two (2) methods:
 *  1) connect()
 *  2) sendMessage(message)
 *
 * @param   {String}  [serverHost]  Server host, if not given fallback to 'localhost'
 * @param   {Number}  [serverPort]  Server port, if not given fallback to '6969'
 * @param   {String}  [player]      Player name, if not given fallback to 'T0P1 (C1-10P)'
 * @constructor
 */
function Game(serverHost, serverPort, player) {
  //Logger.silly('Connection class initialized.', JSON.stringify(arguments));

  var _this = this;

  // Initialize class properties
  _this.serverHost = serverHost || 'localhost';
  _this.serverPort = serverPort || 6969;
  _this.player = player || 'T0P1 (C1-10P)';
  _this.client = '';

  // And connect to server
  _this._connect();
}

/**
 * Message sending method.
 *
 * @param   {{}|String} message Message to be sent to server
 * @returns {Boolean}
 */
Game.prototype.sendMessage = function sendMessage(message) {
  //Logger.silly('Entering to \'sendMessage()\' method.');

  var _this = this;

  Logger.info('Sending message to server', JSON.stringify(message));

  return _this.client.write(JSON.stringify(message));
};

/**
 * Connect method of the class. This will connect to specified host and port and register event handler to process all
 * messages from server.
 *
 * @private
 */
Game.prototype._connect = function _connect() {
  //Logger.silly('Entering to \'connect()\' method.');

  var _this = this;

  // Create connection to specified server
  _this.client = net.connect({
    host: _this.serverHost,
    port: _this.serverPort
  }, function listener() {
    Logger.info('Connected to server: ' + _this.serverHost + ':' + _this.serverPort);

    // Create new Handler instance and join game
    var handler = new Handler(_this);

    handler.joinGame();
  });
};

module.exports = Game;
