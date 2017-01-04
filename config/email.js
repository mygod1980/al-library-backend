/**
 * Created by eugenia on 01/02/16.
 */
const Bluebird = require('bluebird');
const nodemailer = require('nodemailer');

const config = require('config/config');

if (config.email.options.service === 'ses') {
  config.email.options.transport = 'ses';
  config.email.options.accessKeyId = config.aws.accessKeyId;
  config.email.options.secretAccessKey = config.aws.secretAccessKey;
}

module.exports = {
  transport: Bluebird.promisifyAll(nodemailer.createTransport(config.email.options)),
  options: {
    from: config.email.from
  }
};

