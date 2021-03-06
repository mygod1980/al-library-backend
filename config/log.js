/**
 * Created by eugenia on 27/10/14.
 */
'use strict';

const winston = require('winston');
const config = require('config/config');

// override winston.logger.log to add stacktrace along errors included
// (https://gist.github.com/johndgiese/59bd96360ce411042294)
function expandErrors (logger) {
  var oldLogFunc = logger.log;
  logger.log = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    if (args.length >= 2 && args[1] instanceof Error) {
      args[1] = args[1].stack;
    }
    return oldLogFunc.apply(this, args);
  };
  return logger;
}

function getLogger(module) {
  const path = module.filename.split('/').slice(-2).join('/');
  const transports = [];
  if (!config.logger.suppressStdout) {
    transports.push(
      new winston.transports.Console({
        colorize:   true,
        level:      config.logger.level,
        label:      path
      })
    );
  }

  return expandErrors(new winston.Logger({
    transports : transports
  }));
}

module.exports = getLogger;
