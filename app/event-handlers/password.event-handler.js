/**
 * Created by eugenia on 05/06/16.
 */
'use strict';

const emailService = new require('app/lib/services/email.service');

module.exports = (eventBus) => {
  eventBus.on(eventBus.EVENTS.FORGOT_PASSWORD, function (event) {
    emailService.sendForgotEmail(event);
  });

  eventBus.on(eventBus.EVENTS.RESET_PASSWORD, function (event) {
    emailService.sendResetEmail(event);
  });
};
