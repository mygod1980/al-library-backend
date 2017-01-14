'use strict';

/**
 * Module dependencies.
 */
const express = require('express');
const log = require('./log')(module);
const bodyParser = require('body-parser');
const compress = require('compression');
const methodOverride = require('method-override');

module.exports = function () {
  // Initialize express app
  const app = express();

  app.enable('trust proxy');

  require('app/lib/middleware/istanbul')(app);

  app.use(require('app/lib/middleware/health-check')());

  // Passing the request url to environment locals
  app.use(function (req, res, next) {
    res.locals.url = req.protocol + '://' + req.headers.host + req.url;
    next();
  });

  app.use(require('app/lib/middleware/cross-domain')(app));

  // Should be placed before express.static
  app.use(compress({
    filter: function (req, res) {
      return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
    },
    level: 9
  }));

  require('app/lib/middleware/apidocs')(app, express);

  // Showing stack errors
  app.set('showStackError', true);
  app.set('view engine', 'pug');
  // Environment dependent middleware
  if (process.env.NODE_ENV !== 'production') {
    require('app/lib/middleware/debug-logger')(app, log);
  } else {
    app.locals.cache = 'memory';
  }

  // Request body parsing middleware should be above methodOverride
  app.use(bodyParser.urlencoded({
    extended: true,
    limit: '200mb'
  }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  // Enable jsonp
  app.enable('jsonp callback');

  require('app/lib/middleware/oauthifizer')(app);

  require('app/lib/middleware/helmet')(app);

  // uncomment later if we need it
  // require('app/lib/middleware/socket-io')(app);

  require('app/lib/middleware/restifizer')(app, log, 'app/controllers/api/**/*.js');

  require('app/lib/middleware/jobs-testing')(app);
  require('app/lib/middleware/testing')(app);

  require('app/lib/middleware/handle-errors')(app);

  return app;
};
