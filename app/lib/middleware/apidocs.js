'use strict';

module.exports = (app, express) => {
  app.use('/apidocs', express.static('apidocs'));
};