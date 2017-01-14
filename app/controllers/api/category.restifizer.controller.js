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

const Category = mongoose.model('Category');

/**
 * @apiDefine CategoryRequest
 * @apiParam {String} name name
 */

/**
 * @apiDefine CategoryResponse
 * @apiSuccess {String} name name
 * @apiSuccess {String(ISODate)} createdAt
 * @apiSuccess {String(ISODate)} updatedAt
 */

/**
 * @apiGroup Category
 * @apiName GetCategories
 * @api {get} /api/categories Get Category List
 * @apiDescription Returns array of Categories.
 * @apiPermission bearer, admin
 *
 * @apiUse BearerAuthHeader
 * @apiUse CategoryResponse
 */

/**
 * @apiGroup Category
 * @apiName GetCategory
 * @api {get} /api/categories/:_id Get Category
 * @apiDescription Returns Category by id. Regular Categories can get only own profile.
 * @apiPermission bearer
 *
 * @apiParam {String} _id Category id
 * 
 *
 * @apiUse BearerAuthHeader
 * @apiUse CategoryResponse
 */

/**
 * @apiGroup Category
 * @apiName Create
 * @api {post} /api/categories Create Category
 * @apiDescription Creates a Category.
 * @apiPermission bearer, admin
 *
 * @apiUse ClientAuthParams
 * @apiUse BearerAuthHeader
 * @apiUse CategoryRequest
 * @apiUse CategoryResponse
 */

/**
 * @apiGroup Category
 * @apiName UpdateCategory
 * @api {patch} /api/categories/:_id Update Category
 * @apiDescription Updates Category by id.
 * @apiPermission bearer, admin
 *
 * @apiParam {String} _id Category id
 *
 * @apiUse BearerAuthHeader
 * @apiUse CategoryRequest
 * @apiUse CategoryResponse
 */

/**
 * @apiGroup Category
 * @apiName RemoveCategory
 * @api {delete} /api/categories/:_id Remove Category
 * @apiDescription Removes Category by id.
 * @apiPermission bearer, admin
 *
 * @apiParam {String} _id Category id
 *
 * @apiUse BearerAuthHeader
 * @apiUse EmptySuccess
 */
class CategoryController extends BaseController {
  constructor(options = {}) {

    Object.assign(options, {
      dataSource: {
        type: 'mongoose',
        options: {
          model: Category
        }
      },
      path: '/api/categories',
      fields: [
        'name',
        'description',
        'createdAt',
        'updatedAt'
      ],
      qFields: ['name', 'description'],
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
    if (!scope.isAdmin() && scope.isChanging()) {
      return Bb.reject(HTTP_STATUSES.FORBIDDEN.createError());
    }
  }


}

module.exports = CategoryController;
