/**
 * Created by eugenia on 05.01.2017.
 */
'use strict';

const emailService = new require('app/lib/services/email.service');

module.exports = (eventBus) => {
  eventBus.on(eventBus.EVENTS.REGISTRATION_REQUEST, function (event) {
    emailService.sendRegistrationRequestEmail(event);
  });

  eventBus.on(eventBus.EVENTS.REGISTRATION_REQUEST_APPROVED, function (event) {
    emailService.sendRegistrationRequestApprovedEmail(event);
  });

  eventBus.on(eventBus.EVENTS.REGISTRATION_REQUEST_REJECTED, function (event) {
    emailService.sendRegistrationRequestRejectedEmail(event);
  });

  eventBus.on(eventBus.EVENTS.DOWNLOAD_LINK_REQUEST, function (event) {
    emailService.sendDownloadLinkRequestEmail(event);
  });

  eventBus.on(eventBus.EVENTS.DOWNLOAD_LINK_REQUEST_APPROVED, function (event) {
    emailService.sendDownloadLinkApprovedEmail(event);
  });

  eventBus.on(eventBus.EVENTS.DOWNLOAD_LINK_REQUEST_REJECTED, function (event) {
    emailService.sendDownloadLinkRejectedEmail(event);
  });

};
