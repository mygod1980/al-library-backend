'use strict';

module.exports = function () {

  require('config/init')();
  require('config/newrelic');
  const config = require('config/config');
  const log = require('config/log')(module);

  // require mongoose (connect to DB)
  require('config/mongoose');

  /**
   * Main application entry file.
   * Please note that the order of loading is important.
   */
  const app = require('config/express')();

  // Bootstrap script
  log.info('Running bootstrap script...');

  require('config/bootstrap')(app, function (err) {
    if (err) {
      log.error('Bootstrap script failed with error: ' + err.message);
      return;
    }

    log.info('Bootstrap script completed');

    // Start the app by listening on <port>
    app./*http.*/listen(config.port);

    // Logging initialization
    log.info(`"${config.app.title}" application started on port ${config.port}`);
  });
};
