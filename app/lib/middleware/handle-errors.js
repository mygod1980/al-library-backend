'use strict';

module.exports = function (app) {

  var log = require('config/log')(module);

  // Assume 'not found' in the error msgs is a 404. this is somewhat silly, but valid, you can do whatever you like,
  // set properties, use instanceof etc.
  app.use(function (err, req, res, next) {
    // If the error object doesn't exists
    if (!err) {
      return next();
    }

    // Log it
    log.error(err);
    log.error('Stack: ' + err.stack);

    // Error page
    res.status(err.status || 500);
    if (req.method === 'HEAD') {
      return res.end();
    }

    res.send({error: err.message});

  });

  // Assume 404 since no middleware responded
  app.use(function (req, res) {
    res.status(404);
    if (req.method === 'HEAD') {
      return res.end();
    }

    res.send({
      url: req.originalUrl,
      error: 'Not Found'
    });
  });
};