/**
 * Created by eugenia on 01/12/14.
 */

'use strict';

const config = require('config/config');

const version = require('package.json').version;
const User = require('config/mongoose').model('User');

module.exports = (app, callback) => {

  const eventBus = require('config/event-bus');
  eventBus.init();

  eventBus.emit(eventBus.EVENTS.UPDATE_HEALTH, {
    key: 'version',
    status: true,
    value: version
  });

  return require('config/agenda')(app)
    .then((agenda) => {
      app.agenda = agenda;
      agenda.start();
    })
    .asCallback(callback);
};
