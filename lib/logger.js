'use strict';

/**
 * logger.js
 *
 * Simple logger implementation for Kärmes AI-bot. Logger uses winston for actual logging.
 */

// Module dependencies
var winston = require('winston');

// Just suppress any logger errors :D
winston.emitErrs = true;

// noinspection JSValidateTypes
/**
 * Create new winston instance with specified logger options.
 *
 * @type {LoggerInstance}
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

/**
 * Examines the call stack and returns a string indicating the file and line number of the n'th previous ancestor call.
 * This works in chrome, and should work in node.js as well.
 *
 * @see http://stackoverflow.com/questions/20173242/timestamps-disappear-when-adding-the-line-number-configuration-in-node-js-winsto
 *
 * @param {number}  callTraceCount  The number of calls to trace up the stack from the current call.
 *                                  `callTraceCount=0` gives you your current file/line.
 *                                  `callTraceCount=1` gives the file/line that called you.
 */
function traceCaller(callTraceCount) {
  if (isNaN(callTraceCount) || callTraceCount < 0) {
    callTraceCount = 1;
  }

  callTraceCount += 1;

  var s = (new Error()).stack;
  var a = s.indexOf('\n', 5);

  while (callTraceCount--) {
    a = s.indexOf('\n', a + 1);

    if (a < 0) {
      a = s.lastIndexOf('\n', s.length);
      break;
    }
  }

  var b = s.indexOf('\n', a + 1);

  if (b < 0) {
    b = s.length;
  }

  a = Math.max(s.lastIndexOf(' ', b), s.lastIndexOf('/', b));
  b = s.lastIndexOf(':', b);
  s = s.substring(a + 1, b);

  return s;
}

/**
 * Iterate each Winston logger level, and attach filename + line number to each log message. Basically this will just
 * override Winston default logger methods to attach necessary extra information to each log message.
 */
// noinspection JSUnresolvedVariable
for (var func in logger.levels) {
  //noinspection JSUnfilteredForInLoop
  (function(oldFunc) {
    // noinspection JSUnfilteredForInLoop
    logger[func] = function() {
      var args = Array.prototype.slice.call(arguments);

      if (typeof args[0] === 'string') {
        args[0] = traceCaller(1) + ' ' + args[0];
      } else {
        args.unshift(traceCaller(1));
      }

      oldFunc.apply(logger, args);
    };
  })(logger[func]);
}

module.exports = logger;
