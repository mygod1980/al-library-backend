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
  subject: 'Новий запит на реєстрацію',
  to: config.adminMail
};

const credentialsRequestApprovedOptions = {
  subject: `Ваш акаунт у системі ${config.productName}`
};

const credentialsRequestRejectedOptions = {
  subject: `Запит на реєстрацію відхилено`
};

const downloadLinkRequestOptions = {
  subject: 'Новий запит на завантаження',
  to: config.adminMail
};

const downloadLinkRequestApprovedOptions = {
  subject: 'Доступ до ресурсу'
};

const downloadLinkRequestRejectedOptions = {
  subject: 'Запит відхилено'
};

const forgotTpl = pug.compileFile('app/views/templates/forgot.email.view.html');
const credentialsRequestTpl = pug.compileFile('app/views/templates/request.registration.email.view.html');
const credentialsRequestApprovedTpl = pug
  .compileFile('app/views/templates/request.registration.approved.email.view.html');
const credentialsRequestRejectedTpl = pug
  .compileFile('app/views/templates/request.registration.rejected.email.view.html');
const downloadLinkRequestTpl = pug
  .compileFile('app/views/templates/request.downloadLink.email.view.html');
const downloadLinkRequestApprovedTpl = pug
  .compileFile('app/views/templates/request.downloadLink.approved.email.view.html');
const downloadLinkRequestRejectedTpl = pug
  .compileFile('app/views/templates/request.downloadLink.rejected.email.view.html');
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
      password: event.password,
      url: `${config.adminPanelUrl}/#/resources/requests/${event.requestId}`
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
    }, credentialsRequestApprovedOptions);

    return this._sendEmail(credentialsRequestApprovedTpl, templateData, options);
  }

  sendRegistrationRequestRejectedEmail(event) {
    const templateData = {
      appName: config.productName,
      username: event.username,
      firstName: event.firstName,
      lastName: event.lastName,
      adminMail: config.adminMail
    };

    const options = _.extend({
      to: event.username
    }, credentialsRequestRejectedOptions);

    return this._sendEmail(credentialsRequestRejectedTpl, templateData, options);
  }

  sendDownloadLinkRequestEmail(event) {
    const templateData = {
      appName: config.productName,
      username: event.username,
      firstName: event.firstName,
      lastName: event.lastName,
      url: `${config.adminPanelUrl}/#/resources/requests/${event.requestId}`
    };

    return this._sendEmail(downloadLinkRequestTpl, templateData, downloadLinkRequestOptions);
  }

  sendDownloadLinkRequestApprovedEmail(event) {
    const templateData = {
      appName: config.productName,
      url: `${event.downloadLink}/${event.username}/${event.code}`
    };

    const options = _.extend({
      to: event.username
    }, downloadLinkRequestApprovedOptions);

    return this._sendEmail(downloadLinkRequestApprovedTpl, templateData, options);
  }


  sendDownloadLinkRequestRejectedEmail(event) {
    const templateData = {
      appName: config.productName,
      adminMail: config.adminMail
    };

    const options = _.extend({
      to: event.username
    }, downloadLinkRequestRejectedOptions);

    return this._sendEmail(downloadLinkRequestRejectedTpl, templateData, options);
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
