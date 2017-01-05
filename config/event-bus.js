/**
 * Created by eugenia on 29/04/16.
 */
'use strict';

const config = require('config/config');
const log = require('config/log')(module);
const eventBus = require('app/lib/event-bus');

eventBus.EVENTS = {
  UPDATE_HEALTH: 'update.health',
  FORGOT_PASSWORD: 'password.forgot',
  RESET_PASSWORD: 'password.reset',
  USER_REQUESTS_CREDENTIALS: 'user.requestsCredentials'
};

eventBus.register('app', eventBus.EVENTS);
eventBus.setDefaultSpace('app');

eventBus.init = () => {

  config.getGlobbedFiles('./app/event-handlers/*.js', './').forEach(filePath => {
    require(filePath)(eventBus);
  });
};

eventBus.onError((err) => {
  log.error(err);
});

module.exports = eventBus;