'use strict';

/**
 * handler.js
 *
 * This file contains a class that handles all the messages from server. Basically this handler will deliver messages
 * to proper handler(s) which will consume the message and make some magic stuff.
 */

/**#@+
 * Module dependencies
 *
 * @type {exports}
 */
var JSONStream = require('JSONStream');

/** @type {Level} */
var Level = require('./level');

/** @type {Karmes} */
var Karmes = require('./karmes');

/** @type {LoggerInstance} */
var Logger = require('./logger');
/**#@-*/

/**
 * Constructor of the Handler class. This constructor has three (3) main jobs.
 *  1) Create new 'Level' instance
 *  2) Create new 'Karmes' instance, and pass Level to it
 *  3) Register socket listeners
 *
 * @param   {Connection}  connection
 * @constructor
 */
function Handler(connection) {
  //Logger.silly('Handler class initialized.');

  var _this = this;

  // Store connection
  _this.connection = connection;

  // Store player
  _this.player = connection.player;

  // Initialize new level and actual Kärmes!
  _this.level = new Level(_this.player);
  _this.karmes = new Karmes(_this.level, _this.connection);

  // Register socket event listeners
  _this._registerListeners();
}

/**
 * Method to join game.
 *
 * @returns {Boolean|*}
 */
Handler.prototype.joinGame = function joinGame() {
  //Logger.silly('Entering to \'joinGame()\' method.');

  var _this = this;

  Logger.info('Player: \'' + _this.player + '\' joined to game');

  // Join game
  return _this.connection.sendMessage({
    msg: 'join',
    data: {
      player: {
        name: _this.player
      }
    }
  });
};

/**
 * Private helper method to register all necessary socket event listeners from server. This will pipe all socket
 * messages from server to JSONStream parser, so we have proper JSON messages from server instead of pure stream.
 *
 * @private
 */
Handler.prototype._registerListeners = function _registerListeners() {
  //Logger.silly('Entering to \'_registerListeners()\' method.');

  var _this = this;

  Logger.info('Registering all handler listeners for socket messages...');

  // Create JSON stream of current socket connection
  var jsonStream = _this.connection.client.pipe(JSONStream.parse());

  // Yeah we got some data from server, so handle that
  jsonStream.on('data', function onData(data) {
    //Logger.silly('Got \'data\' message', JSON.stringify(data));

    _this._handleMessage(data);
  });

  // Error event, this should not happen... :D
  jsonStream.on('error', function onData(data) {
    //Logger.silly('Got \'error\' message', JSON.stringify(data));

    _this._handleError(data);
  });

  // Stream end handler
  jsonStream.on('end', function onData(data) {
    //Logger.silly('Got \'end\' message', JSON.stringify(data));

    _this._handleEnd(data);
  });
};

/**
 * Method to handle specified message from server. Basically this will just route the message to 'Level' or 'Karmes'
 * classes which will do all necessary magic behind this bot.
 *
 * @param   {{}}  message Socket message to handle
 * @private
 */
Handler.prototype._handleMessage = function _handleMessage(message) {
  //Logger.silly('Entering to \'_handleMessage()\' method.');

  var _this = this;

  Logger.info('Game message: ' + message.msg, JSON.stringify(message.data));

  switch (message.msg) {
    case 'join':
      break;
    case 'create':
      break;
    case 'start':
      _this.level.setGrid(message.data);
      break;
    case 'end':
      break;
    case 'positions':
      var timeStart = new Date();

      Logger.info('Server tick handle started');

      // Set player data
      _this.level.setPlayers(message.data);

      // Set predicted moves according to current data
      _this.level.setPredictedMoves();

      // And then lets make Kärmes to make some choices!
      _this.karmes.doStuff(function callback() {
          var totalTime = new Date().getTime() - timeStart.getTime();

          Logger.info('Server tick handled in: ' + totalTime + 'ms');
        }
      );
      break;
    case 'apple':
      _this.level.setApple(message.data);
      break;
    default:
      Logger.error('Unknown message', JSON.stringify(message));
      break;
  }
};

/**
 * Private helper method to handle possible errors on socket stream.
 *
 * @param   {{}|*}  error
 * @private
 */
Handler.prototype._handleError = function _handleError(error) {
  //Logger.silly('Entering to \'_handleError()\' method.');

  Logger.error('Error', JSON.stringify(error));
};

/**
 * Private helper method to handle end event on socket stream.
 *
 * @param   {{}|*}  reason
 * @private
 */
Handler.prototype._handleEnd = function _handleEnd(reason) {
  //Logger.silly('Entering to \'_handleEnd()\' method.');

  Logger.warn('Stream ended', JSON.stringify(reason));
};

module.exports = Handler;
