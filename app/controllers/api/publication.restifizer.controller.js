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

const Publication = mongoose.model('Publication');

/**
 * @apiDefine PublicationRequest
 * @apiParam {String} title title publication title
 * @apiParam {String} author author publication author _id
 * @apiParam {String} description description publication description
 * @apiParam {Array} tags tags categories publication is tagged with
 * @apiParam {String} downloadLink downloadLink link to digital copy of publication
 * @apiParam {Number} publishedAt publishedAt publication date
 *
 */

/**
 * @apiDefine PublicationResponse
 * @apiSuccess {String} title title publication title
 * @apiSuccess {String} description description publication description
 * @apiSuccess {String} publishedAt publishedAt publication date
 * @apiSuccess {Object} [author] publication author
 * @apiSuccess {String} [author.firstName] firstName
 * @apiSuccess {String} [author.secondName] secondName
 * @apiSuccess {String} [author.lastName] lastName
 * @apiSuccess {String} [author.description] description
 * @apiSuccess {Array} tags tags categories publication is tagged with
 * @apiSuccess {String} downloadLink downloadLink link to digital copy of publication
 * @apiSuccess {String(ISODate)} createdAt
 * @apiSuccess {String(ISODate)} updatedAt
 */

/**
 * @apiGroup Publication
 * @apiName GetPublications
 * @api {get} /api/publications Get Publication List
 * @apiDescription Returns array of publications.
 *

 * @apiUse BearerAuthHeader
 * @apiUse PublicationResponse
 */

/**
 * @apiGroup Publication
 * @apiName GetPublication
 * @api {get} /api/publications/:_id Get Publication
 * @apiDescription Returns user by id. Regular publications can get only own profile.
 *
 * @apiParam {String} _id publication id
 * 
 *
 * @apiUse BearerAuthHeader
 * @apiUse PublicationResponse
 */

/**
 * @apiGroup Publication
 * @apiName Create
 * @api {post} /api/publications Create Publication
 * @apiDescription Creates a user.
 * @apiPermission bearer, admin
 *
 * @apiUse BearerAuthHeader
 * @apiUse PublicationRequest
 * @apiUse PublicationResponse
 */

/**
 * @apiGroup Publication
 * @apiName UpdatePublication
 * @api {patch} /api/publications/:_id Update Publication
 * @apiDescription Updates publication by id.
 * @apiPermission bearer
 *
 * @apiParam {String} _id publication id, you can use "me" shortcut.
 * 
 *
 * @apiUse BearerAuthHeader
 * @apiUse PublicationRequest
 * @apiUse PublicationResponse
 */

/**
 * @apiGroup Publication
 * @apiName RemovePublication
 * @api {delete} /api/publications/:_id Remove Publication
 * @apiDescription Removes publication by id.
 * @apiPermission bearer, admin
 *
 * @apiParam {String} _id publication id, you can use "me" shortcut.
 * 
 *
 * @apiUse BearerAuthHeader
 * @apiUse EmptySuccess
 */
class PublicationController extends BaseController {
  constructor(options = {}) {

    Object.assign(options, {
      dataSource: {
        type: 'mongoose',
        options: {
          model: Publication
        }
      },
      path: '/api/publications',
      fields: [
        'title',
        {
          name: 'author',
          fields: ['firstName', 'lastName', 'secondName', 'description']
        },
        'imageUrl',
        'publishedAt',
        'description',
        'tags',
        'downloadLink',
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


  pre(scope) {
    const user = scope.getUser();

    if (!scope.isAdmin()) {
      return Bb.reject(HTTP_STATUSES.FORBIDDEN.createError());
    }
  }

  // TODO: create unauthenticated route for unauthenticated publications


}

module.exports = PublicationController;
