/**
 * Created by eugenia on 17.05.17.
 */

'use strict';

const Bb = require('bluebird');
const mongoose = require('config/mongoose');
const BaseFileController = require('app/lib/base.file.restifizer.controller.js');
const HTTP_STATUSES = require('http-statuses');
const Publication = require('config/mongoose').model('Publication');
const AccessCode = require('config/mongoose').model('AccessCode');

/**
 * @apiDefine PublicationFileResponse
 * @apiSuccess {Buffer} File
 */

/**
 * @apiGroup Publication
 * @apiName GetFile
 * @api {get} /api/publications/:_id/file Get game file by name
 * @apiDescription Returns file.
 * @apiPermission bearer
 *
 *
 * @apiParam {String} _id game _id
 * @apiParam {String} fileName name of an file
 *
 * @apiUse BearerAuthHeader
 * @apiUse PublicationFileResponse
 */

/**
 * @apiGroup Publication
 * @apiName PutFile
 * @api {put} /api/publications/:_id/file Put game file
 * @apiDescription Publication model has {Object}`files` field,
 * which includes all the files of the game.
 * @apiPermission bearer
 *
 * @apiParam {String} _id game _id
 * @apiParam {String} fileName name of an file
 * @apiParam {File} fileName file itself, multipart-formdata.
 * @apiUse BearerAuthHeader
 * @apiUse PublicationFileResponse
 */

/**
 * @apiGroup Publication
 * @apiName DeleteFile
 * @api {delete} /api/publications/:_id/file Delete game file
 * @apiDescription Returns file.
 * @apiPermission bearer
 *
 * @apiUse BearerAuthHeader
 * @apiUse PublicationFileResponse
 */

class PublicationFileFileController extends BaseFileController {

  constructor(options = {}) {
    Object.assign(options, {
      storage: 'gridfs',
      dataSource: {
        type: 'mongoose',
        options: {
          model: Publication,
        },
      },
      path: '/api/publications/:_id/file',
      fileField: 'file',
      actions: {
        default: BaseFileController.createAction({}),
        getWithAccessCode: {
          enabled: true,
          path: 'download/:requester/:code',
          auth: false,
          method: 'get',
          handler: 'getWithAccessCode',
        },
      },
      supportedMethods: 'post',

    });

    super(options);
  }

  pre(scope) {
    if (!scope.isSelect() && !scope.isAdmin() && scope.action.name !== 'getWithAccessCode') {
      throw HTTP_STATUSES.FORBIDDEN.createError('Only admin can create/replace/delete files');
    }
  }

  getWithAccessCode(scope) {
    const params = scope.getParams();
    const { requester, code } = params;
    if (!code || !requester) {
      return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError('Code and requester are required'));
    }

    delete params.requester;
    delete params.code;

    return AccessCode
      .findOne({ requester, code })
      .then((doc) => {
        if (!doc) {
          return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError('Access to resource is denied'));
        }

        return super.selectOne(scope);
      });
  }
}

module.exports = PublicationFileFileController;
