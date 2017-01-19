/**
 * Created by eugenia on 07.01.17.
 */
const crypto = require('crypto');
const Bb = require('bluebird');
const HTTP_STATUSES = require('http-statuses');
const BaseController = require('app/lib/base.restifizer.controller');
const Request = require('config/mongoose').model('Request');
const Publication = require('config/mongoose').model('Publication');
const eventBus = require('config/event-bus');

function restifizer(restifizerController) {
  /**
   * @apiGroup Request
   * @apiName ChangeRequestStatus
   * @api {post} /api/requests/:_id/:action Change request state
   * @apiDescription Changes request status from pending to approved or rejected. Returns updated request document
   * @apiPermission bearer, admin
   *
   * @apiParam {String} _id _id of request
   * @apiParam {String} action action name, one of ['approve', 'reject']
   *
   * @apiUse BearerAuthHeader
   */
  restifizerController.actions.changeStatus = restifizerController.normalizeAction({
    auth: [BaseController.AUTH.BEARER],
    method: 'post',
    path: ':_id/:action',
    handler: function changeStatus(scope) {
      const {action} = scope.getParams();

      delete scope.req.params.action;

      if (!scope.isAdmin()) {
        return Bb.reject(HTTP_STATUSES.FORBIDDEN.createError(`Only admins can ${action} requests`));
      }

      let isRegistration;
      let eventName;
      const context = {};
      return this
        .locateModel(scope)
        .then((doc) => {
          context.doc = doc;
          isRegistration = doc.type === Request.TYPES.REGISTRATION;

          if (doc.status === Request.STATUSES.APPROVED || doc.status === Request.STATUSES.REJECTED) {
            return Bb.reject(HTTP_STATUSES.FORBIDDEN.createError('No one can change approved or rejected request'));
          }

          const rejectedEventName = isRegistration ?
            eventBus.EVENTS.REGISTRATION_REQUEST_REJECTED :
            eventBus.EVENTS.DOWNLOAD_LINK_REQUEST_REJECTED;
          const approvedEventName = isRegistration ?
            eventBus.EVENTS.REGISTRATION_REQUEST_APPROVED :
            eventBus.EVENTS.DOWNLOAD_LINK_REQUEST_APPROVED;

          eventName = action === 'approve' ? approvedEventName : rejectedEventName;

          if (action === 'approve') {
            doc.set('status', Request.STATUSES.APPROVED);
          } else if (action === 'reject') {
            doc.set('status', Request.STATUSES.REJECTED);
          } else {
            throw new Error('Unknown status');
          }

          const getPublication = () => {
            if (!isRegistration) {
              return Publication.findById(doc.extra.publicationId);
            }
          };

          return Bb.join(doc.save(), getPublication());
        })
        .spread((doc, publication) => {

          const extra = Object.assign({username: doc.username}, doc.extra);
          if (!isRegistration) {

            if (!publication) {
              return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError('Publication does not exist'));
            }

            extra.publication = publication;
            extra.downloadLink = `${scope.req.protocol}://${scope.req.get('host')}`+
              `/api/publications/${publication._id}/download`;
          }
          eventBus.emit(eventName, extra);

          return doc;
        });
    }
  }, 'changeStatus');

}

module.exports.restifizer = restifizer;