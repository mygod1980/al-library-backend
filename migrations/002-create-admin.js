'use strict';

const db = require('config/mongoose');
const User = db.model('User');
const log = require('../config/log')(module);
const config = require('../config/config');

exports.up = function (next) {
  log.info('Creating default admin account');

  User
    .findOne({username: config.defaultUser.username})
    .then((user) => {
      if (!user) {
        return User.create(
          Object.assign(config.defaultUser, {
            role: config.roles.ADMIN,
          }));
      }
    })
    .asCallback(next);
};

exports.down = function (next) {
  log.info('Deleting default admin account');

  return User
    .remove({username: config.defaultUser.username}, next);
};
