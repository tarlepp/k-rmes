'use strict';

/**
 * connection.js
 *
 * This file contains all logic to communicate between specified server.
 *
 * Usage example:
 *  var Connection = require('./connection');
 *  var connection = new Connection('host', 'port', 'player');
 *
 *  connection.connect();
 *
 * After this you have made connection to specified server.
 *
 * @type {exports}
 */

// Module dependencies
var net = require('net');
var Handler = require('./handler');

/**
 * Connection class constructor. This class contains all necessary methods to communicate between server. This class
 * contains only two (2) methods:
 *  1) connect()
 *  2) sendMessage(message)
 *
 * @todo write tests
 *
 * @param   {String}  [serverHost]  Server host, if not given fallback to 'localhost'
 * @param   {Number}  [serverPort]  Server port, if not given fallback to '6969'
 * @param   {String}  [player]      Player name, if not given fallback to 'T0P1 (C1-10P)'
 * @constructor
 */
function Connection(serverHost, serverPort, player) {
  var self = this;

  // Initialize class properties
  self.serverHost = serverHost || 'localhost';
  self.serverPort = serverPort || 6969;
  self.player = player || 'T0P1 (C1-10P)';
  self.client = '';
}

/**
 * Connect method of the class. This will connect to specified host and port and register event handler to process all
 * messages from server.
 *
 * @todo Error handling?
 */
Connection.prototype.connect = function connect() {
  var self = this;

  // Create connection to specified server
  self.client = net.connect({
    host: self.serverHost,
    port: self.serverPort
  }, function listener() {
    var handler = new Handler(self);

    handler.joinGame();
  });
};

/**
 * Message sending method.
 *
 * @param   {{}|String} message Message to be sent to server
 * @returns {Boolean}
 */
Connection.prototype.sendMessage = function sendMessage(message) {
  var self = this;

  return self.client.write(JSON.stringify(message));
};

module.exports = Connection;
