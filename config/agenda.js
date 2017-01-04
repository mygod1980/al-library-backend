/**
 * Created by eugenia on 23/01/15.
 */

'use strict';

const Bb = require('bluebird');
const path = require('path');
const config = require('config/config');
const log = require('config/log')(module);
const Agenda = Bb.promisifyAll(require('agenda'));

module.exports = function (app) {
  return new Bb(function (resolve, reject) {
    try {
      const agenda = Bb.promisifyAll(new Agenda({
        db: {address: config.mongo},
        processEvery: config.agenda.processEvery
      }));

      agenda.JOB_NAMES = {};

      // we swallow starting in test mode
      if (process.env.NODE_ENV === 'test') {
        agenda.start = () => {
          log.info('agenda.start simulation');
        }
      }

      config.getGlobbedFiles('./app/lib/jobs/**/*.js').forEach((jobFile) => {
        Object.assign(agenda.JOB_NAMES, require(path.resolve(jobFile))(agenda, app));
      });

      const graceful = () => {
        agenda.stop(function() {
          process.exit(0);
        });
      };

      process.on('SIGTERM', graceful);
      process.on('SIGINT', graceful);

      agenda.on('ready', () => {
        resolve(agenda);
      });

    } catch (err) {
      reject(err);
    }
  });

};
