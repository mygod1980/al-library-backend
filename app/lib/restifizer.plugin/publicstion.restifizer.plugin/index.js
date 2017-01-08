/**
 * Created by eugenia on 07.01.17.
 */
const crypto = require('crypto');
const _ = require('lodash');
const Bb = require('bluebird');
const HTTP_STATUSES = require('http-statuses');
const BaseController = require('app/lib/base.restifizer.controller');
const Publication = require('config/mongoose').model('Publication');
const AccessCode = require('config/mongoose').model('AccessCode');
const S3Service = require('app/lib/services/s3');
const config = require('config/config');

function restifizer(restifizerController) {

  restifizerController.actions.upload = restifizerController.normalizeAction({
    auth: [BaseController.AUTH.BEARER],
    method: 'post',
    path: ':_id/upload',
    handler: function upload(scope) {
      const body = scope.getBody();
      let file;

      if (config.isTest) {
        file = body.files.file;
      } else {
        file = body.file;
      }

      if (!file) {
        return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError('File is missing'));
      }

      if (!scope.isAdmin()) {
        /* TODO: check if is student*/
        return Bb.reject(HTTP_STATUSES.FORBIDDEN.createError(`Only admins can upload publications`));
      }

      return this
        .locateModel(scope)
        .then((doc) => {
          return S3Service.upload({data: file, key: doc._id});
        });
    }
  }, 'upload');

  /**
   * unprotected route for anonymous users
   * we check access rights by access code passed in URL params
   * */

  restifizerController.actions.download = restifizerController.normalizeAction({
    auth: false,
    method: 'get',
    path: ':_id/download/:requester/:code',
    handler: function download(scope) {
      const {requester, code} = scope.getParams();
      if (!code || !requester) {
        return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError('Code and requester are required'));
      }

      return this
        .locateModel(scope)
        .then(() => {
          return AccessCode.findOne({requester, code});
        })
        .then((doc) => {
          if (!doc) {
            return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError('Access to resource cannot be established'));
          }

          return S3Service.download({data: file, key: doc.publication});
        });
    }
  }, 'download');

  /**
   * protected route for authenticated users
   * */
  restifizerController.actions.getFile = restifizerController.normalizeAction({
    auth: [BaseController.AUTH.BEARER],
    method: 'get',
    path: ':_id/getFile',
    handler: function download(scope) {

      return this
        .locateModel(scope)
        .then((doc) => {
          return S3Service.download(doc._id);
        });
    }
  }, 'getFile');
}

module.exports.restifizer = restifizer;