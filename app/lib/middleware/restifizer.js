'use strict';

const _ = require('lodash');
const Restifizer = require('restifizer');

const config = require('config/config');
const eventBus = require('config/event-bus');
const eventTypes = _.values(eventBus.ENTITY_EVENT_TYPES);
const ExpressTransport = Restifizer.ExpressTransport;

module.exports = function (app, log, path) {

  const transport = new ExpressTransport({
    app: app,
    compatibilityMode: true
  });

  transport.getAuth = function getAuth(options) {
    let auths = [
      app.oAuthifizer.authenticate(options.auth, {session: false}),
      function (req, res, next) {
        if (!req.isAuthenticated()) {
          //options
          return res.status(401).send({
            message: 'User is not logged in'
          });
        }

        next();
      }
    ];
    return options.auth ? auths : function (req, res, callback) {
      callback();
    };
  };

  const restifizer = new Restifizer({
    transports: [transport],
    log: log
  });

  config.getGlobbedFiles(path, './').forEach(function (filePath) {
    const Controller = require(filePath);

    restifizer.addController(Controller);

    const extractedName = Controller.getName();

    eventTypes.forEach((type) => eventBus.ENTITY_EVENTS[`${extractedName}.${type}`] = `${extractedName}.${type}`);
  });

  eventBus.register(eventBus.ENTITY_EVENT_SPACE, eventBus.ENTITY_EVENTS);
};
