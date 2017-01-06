/**
 * Created by eugenia on 06.01.2017.
 */

'use strict';

const Bb = require('bluebird');

const HTTP_STATUSES = require('http-statuses');
const mongoose = require('config/mongoose');
const config = require('config/config');
const BaseController = require('app/lib/base.restifizer.controller');
const eventBus = require('config/event-bus');

const Request = mongoose.model('Request');

/**
 * @apiDefine RequestRequest
 * @apiParam {String} type type, one of ['registration', 'downloadLink']
 * @apiParam {String} status status, one of ['pending', 'approved', 'rejected']
 * @apiParam {Object} extra extra, if type is registration `extra` contains username, firstName, lastName, role
 * else
 * Publication id, username
 */

/**
 * @apiDefine RequestResponse
 * @apiSuccess {String} type type
 * @apiSuccess {String} status status
 * @apiSuccess {Object} extra extra
 * @apiSuccess {String(ISODate)} createdAt
 * @apiSuccess {String(ISODate)} updatedAt
 */

/**
 * @apiGroup Request
 * @apiName GetRequests
 * @api {get} /api/requests Get Request List
 * @apiDescription Returns array of requests.
 * @apiPermission bearer, admin
 *
 * @apiUse BearerAuthHeader
 * @apiUse RequestResponse
 */

/**
 * @apiGroup Request
 * @apiName GetRequest
 * @api {get} /api/requests/:_id Get Request
 * @apiDescription Returns request by id. Regular requests can get only own profile.
 * @apiPermission bearer
 *
 * @apiParam {String} _id request id
 * 
 *
 * @apiUse BearerAuthHeader
 * @apiUse RequestResponse
 */

/**
 * @apiGroup Request
 * @apiName Create
 * @api {post} /api/requests Create Request
 * @apiDescription Creates a request.
 * @apiPermission client, bearer
 *
 * @apiUse ClientAuthParams
 * @apiUse BearerAuthHeader
 * @apiUse RequestRequest
 * @apiUse RequestResponse
 */

/**
 * @apiGroup Request
 * @apiName UpdateRequest
 * @api {patch} /api/requests/:_id Update Request
 * @apiDescription Updates request by id.
 * @apiPermission bearer
 *
 * @apiParam {String} _id request id
 *
 * @apiUse BearerAuthHeader
 * @apiUse RequestRequest
 * @apiUse RequestResponse
 */

/**
 * @apiGroup Request
 * @apiName RemoveRequest
 * @api {delete} /api/requests/:_id Remove Request
 * @apiDescription Removes request by id.
 * @apiPermission bearer
 *
 * @apiParam {String} _id request id
 *
 * @apiUse BearerAuthHeader
 * @apiUse EmptySuccess
 */
class RequestController extends BaseController {
  constructor(options = {}) {

    Object.assign(options, {
      dataSource: {
        type: 'mongoose',
        options: {
          model: Request
        }
      },
      path: '/api/requests',
      fields: [
        'type',
        'status',
        'extra',
        'createdAt',
        'updatedAt'
      ],
      readOnlyFields: ['createdAt', 'updatedAt'],
      actions: {
        'default': BaseController.createAction({
          auth: [BaseController.AUTH.BEARER]
        }),
        insert: BaseController.createAction({
          auth: [BaseController.AUTH.CLIENT]
        })
      }
    });

    super(options);

  }

  pre(scope) {
    const user = scope.getUser();

    if (!user.isAdmin() && !scope.isInsert()) {
      return Bb.reject(HTTP_STATUSES.FORBIDDEN.createError());
    }
  }

  beforeSave(scope) {
    const {model, source} = scope;
    const extra = scope.getBody();

    if (model.status === Request.STATUSES.PENDING) {
      if (source.status === Request.STATUSES.APPROVED) {
        if (source.type === Request.TYPES.REGISTRATION) {
          const event = Object.assign({}, extra);

          eventBus.emit(eventBus.EVENTS.REGISTRATION_REQUEST, event);
        } else /* source.type === Request.TYPES.DOWNLOAD_LINK */ {
          const event = Object.assign({}, extra);
        }
      } else {

      }
    }
  }
}

module.exports = RequestController;
