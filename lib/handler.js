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
var events = require('events');
var eventEmitter = new events.EventEmitter();

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
  var self = this;

  Logger.silly('Handler class initialized.');

  // Store connection
  self.connection = connection;

  // Store player
  self.player = connection.player;

  // Initialize new level and actual Kärmes!
  self.level = new Level(self.player);
  self.karmes = new Karmes(self.level, self.connection, eventEmitter);

  // Register socket event listeners
  self._registerListeners();
}

/**
 * Method to join game.
 *
 * @returns {Boolean|*}
 */
Handler.prototype.joinGame = function joinGame() {
  var self = this;

  Logger.info('Player: \'' + self.player + '\' joined to game');

  // Join game
  return self.connection.sendMessage({
    msg: 'join',
    data: {
      player: {
        name: self.player
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
  var self = this;

  Logger.info('Registering all Handler listeners for socket messages...');

  // Create JSON stream of current socket connection
  var jsonStream = self.connection.client.pipe(JSONStream.parse());

  // Yeah we got some data from server, so handle that
  jsonStream.on('data', function onData(data) {
    Logger.silly('Got \'data\' message', JSON.stringify(data));

    self._handleMessage(data);
  });

  // Error event, this should not happen... :D
  jsonStream.on('error', function onData(data) {
    Logger.silly('Got \'error\' message', JSON.stringify(data));

    self._handleError(data);
  });

  // Stream end handler
  jsonStream.on('end', function onData(data) {
    Logger.silly('Got \'end\' message', JSON.stringify(data));

    self._handleEnd(data);
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
  var self = this;

  Logger.info('Game message: ' + message.msg, JSON.stringify(message.data));

  switch (message.msg) {
    case 'joined':
      break;
    case 'created':
      break;
    case 'start':
      self.level.setGrid(message.data);
      break;
    case 'end':
      break;
    case 'positions':
      eventEmitter.emit('newMessage');

      self.level.setPlayers(message.data)
        .then(
          function onResult(paths) {
            self.karmes.makeMove(message.data, paths);
          }
        )
      ;
      break;
    case 'apple':
      self.level.setApple(message.data);
      break;
    default:
      Logger.warn('Unknown message', JSON.stringify(message));
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
  Logger.error('Error', JSON.stringify(error));
};

/**
 * Private helper method to handle end event on socket stream.
 *
 * @param   {{}|*}  reason
 * @private
 */
Handler.prototype._handleEnd = function _handleEnd(reason) {
  Logger.info('Stream ended', JSON.stringify(reason));
};

module.exports = Handler;
