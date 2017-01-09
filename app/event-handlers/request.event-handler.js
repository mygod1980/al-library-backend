/**
 * Created by eugenia on 05.01.2017.
 */
'use strict';
const crypto = require('crypto');
const Request = require('config/mongoose').model('Request');
const AccessCode = require('config/mongoose').model('AccessCode');
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
    const accessCode = {
      code: crypto.randomBytes(32).toString('base64'),
      requester: event.username,
      publication: event.publicationId
    };

    return AccessCode
      .remove({
        requester: accessCode.requester,
        publication: accessCode.publicationId
      })
      .then(() => {
        return AccessCode.create(accessCode);
      })
      .then((doc) => {
        const data = Object.assign(
          {
            code: doc.code
          },
          event
        );
        return emailService.sendDownloadLinkRequestEmail(data);
      });
  });

  eventBus.on(eventBus.EVENTS.DOWNLOAD_LINK_REQUEST_APPROVED, function (event) {
    return AccessCode
      .findOne({
        requester: event.username,
        publication: event.publication._id
      })
      .then((doc) => {
        const data = Object.assign({code: doc.code}, event);
        return emailService.sendDownloadLinkRequestApprovedEmail(data);
      });
  });

  eventBus.on(eventBus.EVENTS.DOWNLOAD_LINK_REQUEST_REJECTED, function (event) {
    return AccessCode
      .remove({
        requester: event.username,
        publication: event.publication._id
      })
      .then(() => {
        return emailService.sendDownloadLinkRequestRejectedEmail(event);
      });
  });

};
