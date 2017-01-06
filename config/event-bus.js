/**
 * Created by eugenia on 03.01.2017.
 */
'use strict';

const config = require('config/config');
const log = require('config/log')(module);
const eventBus = require('app/lib/event-bus');

eventBus.EVENTS = {
  UPDATE_HEALTH: 'update.health',
  FORGOT_PASSWORD: 'password.forgot',
  RESET_PASSWORD: 'password.reset',
  REGISTRATION_REQUEST: 'request.registration',
  REGISTRATION_REQUEST_APPROVED: 'request.registration.approved',
  REGISTRATION_REQUEST_REJECTED: 'request.registration.rejected',
  DOWNLOAD_LINK_REQUEST: 'request.downloadLink',
  DOWNLOAD_LINK_REQUEST_APPROVED: 'request.downloadLink.approved',
  DOWNLOAD_LINK_REQUEST_REJECTED: 'request.downloadLink.rejected'
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