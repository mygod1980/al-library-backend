/**
 * Created by eugenia on 05/26/16.
 */

'use strict';

let healthService = require('app/lib/services/health.service');

module.exports = function () {
  return function (req, res, next) {
    var matchingPath = req.url.match(/^\/health$/);

    if (!matchingPath) {
      return next();
    }
    
    res.status(healthService.isOk() ? 200 : 503).json(healthService.getData());
  };
};
