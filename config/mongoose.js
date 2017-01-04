'use strict';

const Bb = require('bluebird');
const mongoose = require('mongoose');
const config = require('config/config');
const eventBus = require('config/event-bus');

// mongoose.set('debug', true);
mongoose.Promise = Bb;

const healthOk = function () {
  eventBus.emit(eventBus.EVENTS.UPDATE_HEALTH, {
    key: 'mongodb',
    status: true,
    value: 'OK'
  });
};

const healthProblem = function (err) {
  eventBus.emit(eventBus.EVENTS.UPDATE_HEALTH, {
    key: 'mongodb',
    status: false,
    value: JSON.stringify(err)
  });
};

mongoose.connect(config.mongo);

const db = mongoose.connection;

db.on('error', (err) => {
  healthProblem(err);
  console.error(err);
});
db.on('open', function () {
  healthOk();
});

let oldModelFn = mongoose.model;

mongoose.model = function (name, schema, collection, skipInit) {
  /* jshint ignore:start */
  if (schema && schema.instanceOfSchema) {
    // code to patch every schema
  }
  /* jshint ignore:end */

  return oldModelFn.apply(this, arguments);
};

config.getGlobbedFiles('./app/models/*.js', './').forEach(function (filePath) {
  require(filePath)(mongoose);
});

module.exports = mongoose;