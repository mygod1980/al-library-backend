/**
 * Created by eugenia on 05.01.2017.
 */
'use strict';

const emailService = new require('app/lib/services/email.service');

module.exports = (eventBus) => {
  eventBus.on(eventBus.EVENTS.USER_REQUESTS_CREDENTIALS, function (event) {
    emailService.sendUserRequestsCredentialsEmail(event);
  });

  eventBus.on(eventBus.EVENTS.CREDENTIALS_REQUEST_PROCESSED, function (event) {
    emailService.sendCredentialsRequestProcessedEmail(event);
  });

  eventBus.on(eventBus.EVENTS.USER_REQUESTS_CREDENTIALS, function (event) {
    emailService.sendUserRequestsCredentialsEmail(event);
  });

  eventBus.on(eventBus.EVENTS.CREDENTIALS_REQUEST_PROCESSED, function (event) {
    emailService.sendCredentialsRequestProcessedEmail(event);
  });

};
