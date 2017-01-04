'use strict';

let _ = require('lodash');
let db = require('config/mongoose');
let User = db.model('User');
let testData = require('./lib/test-data');

module.exports = function () {
  return Bb
    .try(() => {

    })
    .then(() => {
      return 'success';
    });
};