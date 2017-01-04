/**
 * Created by eugenia on 12/10/15.
 */

'use strict';

var helmet = require('helmet');

module.exports = (app) => {
  app.use(helmet.xssFilter());
  app.use(helmet.hidePoweredBy());
  app.use(helmet.ieNoOpen());
  app.use(helmet.noSniff());
};