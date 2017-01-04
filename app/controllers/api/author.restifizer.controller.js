/**
 * Created by eugenia on 03.01.2017.
 */

'use strict';

const _ = require('lodash');
const Bb = require('bluebird');

const HTTP_STATUSES = require('http-statuses');
const mongoose = require('config/mongoose');
const config = require('config/config');
const BaseController = require('app/lib/base.restifizer.controller');

const Author = mongoose.model('Author');

/**
 * @apiDefine AuthorRequest
 * @apiParam {String} firstName firstName
 * @apiParam {String} secondName secondName
 * @apiParam {String} lastName lastName
 * @apiParam {String} description description
 *
 */

/**
 * @apiDefine AuthorResponse
 * @apiSuccess {String} firstName firstName
 * @apiSuccess {String} secondName secondName
 * @apiSuccess {String} lastName lastName
 * @apiSuccess {String} description description
 * @apiSuccess {String(ISODate)} createdAt
 * @apiSuccess {String(ISODate)} updatedAt
 */

/**
 * @apiGroup Author
 * @apiName GetAuthors
 * @api {get} /api/authors Get Author List
 * @apiDescription Returns array of authors.
 * @apiPermission bearer, admin
 *
 * 

 * @apiUse BearerAuthHeader
 * @apiUse AuthorResponse
 */

/**
 * @apiGroup Author
 * @apiName GetAuthor
 * @api {get} /api/authors/:_id Get Author
 * @apiDescription Returns author by id. Regular authors can get only own profile.
 * @apiPermission bearer
 *
 * @apiParam {String} _id author id
 * 
 *
 * @apiUse BearerAuthHeader
 * @apiUse AuthorResponse
 */

/**
 * @apiGroup Author
 * @apiName Create
 * @api {post} /api/authors Create Author
 * @apiDescription Creates a author.
 * @apiPermission client, bearer
 *
 * @apiUse ClientAuthParams
 * @apiUse BearerAuthHeader
 * @apiUse AuthorRequest
 * @apiUse AuthorResponse
 */

/**
 * @apiGroup Author
 * @apiName UpdateAuthor
 * @api {patch} /api/authors/:_id Update Author
 * @apiDescription Updates author by id.
 * @apiPermission bearer
 *
 * @apiParam {String} _id author id
 *
 * @apiUse BearerAuthHeader
 * @apiUse AuthorRequest
 * @apiUse AuthorResponse
 */

/**
 * @apiGroup Author
 * @apiName RemoveAuthor
 * @api {delete} /api/authors/:_id Remove Author
 * @apiDescription Removes author by id.
 * @apiPermission bearer
 *
 * @apiParam {String} _id author id
 *
 * @apiUse BearerAuthHeader
 * @apiUse EmptySuccess
 */
class AuthorController extends BaseController {
  constructor(options = {}) {

    Object.assign(options, {
      dataSource: {
        type: 'mongoose',
        options: {
          model: Author
        }
      },
      path: '/api/authors',
      fields: [
        'firstName',
        'secondName',
        'lastName',
        'description',
        'createdAt',
        'updatedAt'
      ],
      readOnlyFields: ['createdAt', 'updatedAt'],
      actions: {
        'default': BaseController.createAction({
          auth: [BaseController.AUTH.BEARER]
        })
      }
    });

    super(options);

  }

  assignFilter(queryParams, fieldName, scope) {
    return (!scope.isUpdate() || fieldName !== 'password') &&
      super.assignFilter(queryParams, fieldName, scope);
  }

  pre(scope) {
    const user = scope.getUser();

    if (!user.isAdmin()) {
      return Bb.reject(HTTP_STATUSES.FORBIDDEN.createError());
    }
  }


}

module.exports = AuthorController;
