/**
 * Created by eugenia on 11/03/16.
 */

var config = require('config/config');

var newrelic;

if (config.newRelic.enabled) {
  // We need to use this path in order to prevent using `newrelic.js` from the app
  newrelic = require('../node_modules/newrelic');
} else {
  newrelic = {
  };
}

module.exports = newrelic;