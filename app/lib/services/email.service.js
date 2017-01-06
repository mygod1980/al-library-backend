/**
 * Created by eugenia on 01/02/16.
 */

'use strict';

const _ = require('lodash');
const Bb = require('bluebird');
const pug = require('pug');

const config = require('config/config');
const emailConfig = require('config/email');
const log = require('config/log')(module);

const forgotEmailOptions = {
  subject: 'Reset password'
};

const resetEmailOptions = {
  subject: 'Your password has been changed'
};

const credentialsRequestOptions = {
  subject: 'User requests credentials',
  to: config.adminMail
};

const credentialsRequestProcessedOptions = {
  subject: `Account at ${config.productName} has been created`
};


const downloadLinkRequestOptions = {
  subject: 'User requests access to publication',
  to: config.adminMail
};

const downloadLinkRequestProcessedOptions = {
  subject: `Access to publication has been granted`
};


const forgotTpl = pug.compileFile('app/views/templates/forgot.email.view.html');
const credentialsRequestTpl = pug.compileFile('app/views/templates/credentials-request.email.view.html');
const credentialsRequestProcessedTpl = pug.compileFile('app/views/templates/credentials-request-processed.email.view.html');
const downloadLinkRequestTpl = pug.compileFile('app/views/templates/access-request.email.view.html');
const downloadLinkRequestProcessedTpl = pug.compileFile('app/views/templates/access-granted.email.view.html');
const resetTpl = pug.compileFile('app/views/templates/reset.email.view.html');

class EmailService {

  constructor() {
    if (config.isTest) {
      this.sentEmails = [];
    }
  }

  sendForgotEmail(event) {
    const templateData = {
      appName: config.app.title,
      name: event.user.username,
      url: event.url + event.user.resetPassword.token
    };

    const emailData = _.extend({
      to: event.user.username
    }, forgotEmailOptions);
    
    return this._sendEmail(forgotTpl, templateData, emailData);
  }

  sendRegistrationRequestEmail(event) {
    const templateData = {
      appName: config.productName,
      username: event.username,
      firstName: event.firstName,
      lastName: event.lastName,
      url: '' /* TODO add URL here*/
    };

    return this._sendEmail(credentialsRequestTpl, templateData, credentialsRequestOptions);
  }

  sendRegistrationRequestApprovedEmail(event) {
    const templateData = {
      appName: config.productName,
      username: event.username,
      firstName: event.firstName,
      lastName: event.lastName,
      password: event.password,
      url: '' /* TODO add URL here*/
    };

    const options = _.extend({
      to: event.username
    }, credentialsRequestProcessedOptions);

    return this._sendEmail(credentialsRequestProcessedTpl, templateData, options);
  }

  sendDownloadLinkRequestEmail(event) {
    const templateData = {
      appName: config.productName,
      username: event.username,
      firstName: event.firstName,
      lastName: event.lastName,
      url: '' /* TODO add URL here*/
    };

    return this._sendEmail(downloadLinkRequestTpl, templateData, downloadLinkRequestOptions);
  }

  sendDownloadLinkApprovedEmail(event) {
    const templateData = {
      appName: config.productName,
      url: '' /* TODO add URL here*/
    };

    const options = _.extend({
      to: event.username
    }, downloadLinkRequestProcessedOptions);

    return this._sendEmail(downloadLinkRequestProcessedTpl, templateData, options);
  }

  sendResetEmail(event) {

    const templateData = {
      appName: config.app.title,
      name: event.user.username
    };
    
    const emailData = _.extend({
      to: event.user.username
    }, resetEmailOptions);
    
    return this._sendEmail(resetTpl, templateData, emailData);
  }

  _sendEmail(template, templateData, emailData) {
    return Bb
      .try(() => {
        return template(templateData);
      })
      .then((emailHtml) => {
        const mailOptions = _.extend({
          html: emailHtml
        }, emailData, emailConfig.options);

        log.info('Sending mail to: ' + mailOptions.to);
        if (!config.isTest) {
          return emailConfig.transport.sendMailAsync(mailOptions);
        } else {
          log.debug('emailService._sendEmail stub called');
          this.sentEmails.push(mailOptions);
        }
      })
      .catch((err) => {
        log.error('Cannot send mail: ' + err);
      });
  }

}

module.exports = new EmailService();
