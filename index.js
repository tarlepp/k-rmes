'use strict';

/**
 * index.js
 *
 * Main file of the Kärmes AI-bot, this is the first entry point when you start the bot.
 *
 * Usage examples:
 *  npm start [host] [port] [player]
 *  node index.js [host] [port] [player]
 *
 * Where
 *  host    = Server host, if not given fallback to 'localhost'
 *  port    = Server port, if not given fallback to '6969'
 *  player  = Player name, if not given fallback to 'T0P1 (C1-10P)'
 */

/**#@+
 * Module dependencies
 *
 * @type {exports}
 */
/** @type {Connection} */
var Connection = require('./lib/connection');

/** @type {LoggerInstance} */
var Logger = require('./lib/logger');
/**#@-*/

try {
  Logger.info('Kärmes AI-bot started with following command:', JSON.stringify(process.argv));

  // Create new connection
  var connection = new Connection(process.argv[2], process.argv[3], process.argv[4]);

  // And connect, this will start actual playing
  connection.connect();
} catch(error) {
  Logger.error('Damn gerbils have stopped running again! Someone has been dispatched to poke them with a sharp stick.');
  Logger.error(JSON.stringify(error));
}
