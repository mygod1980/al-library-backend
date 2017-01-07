'use strict';

const config = require('config/config');

module.exports = function (app) {
  const im = require('istanbul-middleware');
  const coverageEnabled = config.coverageEnabled;

  //before your code is require()-ed, hook the loader for coverage
  if (coverageEnabled) {
    im.hookLoader(__dirname.replace('/app/lib/middleware', ''));
  }

  // add the coverage handler
  if (coverageEnabled) {
    //enable coverage endpoints under /coverage
    app.use('/coverage', im.createHandler());
  }
};
