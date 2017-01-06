'use strict';

/**
 * Module dependencies.
 */
const Bb = require('bluebird');
const glob = require('glob');

/**
 * Module init function.
 */
module.exports = () => {
  /**
   * Before we begin, lets set the environment variable
   * We'll Look for a valid NODE_ENV variable and if one cannot be found load the development NODE_ENV
   */
  glob('./config/env/' + process.env.NODE_ENV + '.js', {
    sync: true
  }, (err, environmentFiles) => {
    console.log();
    if (!environmentFiles.length) {
      if (process.env.NODE_ENV) {
        console.error('\x1b[31m', 'No configuration file found for "' + process.env.NODE_ENV +
          '" environment using development instead');
      } else {
        console.error('\x1b[31m', 'NODE_ENV is not defined! Using default development environment');
      }

      process.env.NODE_ENV = 'development';
    } else {
      console.log('\x1b[7m', 'Application loaded using the "' + process.env.NODE_ENV + '" environment configuration');
    }
    console.log('\x1b[0m');
  });

  Bb.config({
    longStackTraces: true,
    warnings: {
      wForgottenReturn: false
    }
  });

  /**
   * Add our server node extensions
   */
  require.extensions['.server.controller.js'] = require.extensions['.js'];
  require.extensions['.server.model.js'] = require.extensions['.js'];
};