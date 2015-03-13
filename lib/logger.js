'use strict';

/**
 * logger.js
 *
 * Simple logger implementation for Kärmes AI-bot. Logger uses winston for actual logging.
 *
 * @type {exports}
 */

// Module dependencies
var winston = require('winston');

// Just suppress any logger errors :D
winston.emitErrs = true;

/**
 * Create new winston instance with specified logger options.
 *
 * @type {exports.Logger}
 */
var logger = new winston.Logger({
  transports: [
    // Info log to file
    new winston.transports.File({
      level: 'info',
      filename: './logs/info.log',
      handleExceptions: true,
      json: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      colorize: false
    }),
    // And console to show all!
    new winston.transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: false,
      colorize: true
    })
  ],
  exitOnError: false
});

module.exports = logger;
