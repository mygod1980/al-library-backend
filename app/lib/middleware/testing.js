/**
 * Created by eugenia on 05/26/16.
 */

'use strict';

module.exports = function (app) {
  if (process.env.NODE_ENV !== 'production') {

    const emailService = new require('app/lib/services/email.service');

    app.get('/testing/sent-emails', (req, res) => {
      const sentEmails = emailService.sentEmails;
      emailService.sentEmails = [];
      res.json(sentEmails).end();
    });
  }
};
