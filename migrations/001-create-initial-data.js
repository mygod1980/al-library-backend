'use strict';

const mongoose = require('config/mongoose');
const Client = mongoose.model('Client');
const log = require('config/log')(module);
const config = require('config/config');

exports.up = function (next) {
  log.info('Creating default client');

  Client
    .findOne({clientId: config.defaultClient.clientId})
    .then((client) => {
      if (!client) {
        client = new Client(config.defaultClient);
        return client.save();
      }
    })
    .asCallback(next);
};

exports.down = function (next) {
  log.info('Removing default client');

  return Client.remove({clientId: config.defaultClient.clientId}, next);
};
