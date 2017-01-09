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
      const {file} = scope.getBody();

      if (!file) {
        return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError('File is missing'));
      }

      if (!scope.isAdmin()) {
        /* TODO: check if is student*/
        return Bb.reject(HTTP_STATUSES.FORBIDDEN.createError(`Only admins can upload publications`));
      }

      const context = {};
      return this
        .locateModel(scope)
        .then((doc) => {
          context.doc = doc;
          return S3Service.upload({data: file, key: doc._id.toString()});
        })
        .then((data) => {
          context.doc.set('downloadUrl', data.Location);
          return context.doc.save();
        })
        .catch((err) => {
          return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError(err.message));
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
      const params = scope.getParams();
      const {requester, code, _id} = params;
      if (!code || !requester) {
        return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError('Code and requester are required'));
      }

      delete params.requester;
      delete params.code;

      return this
        .locateModel(scope)
        .then(() => {
          return AccessCode.findOne({requester, code});
        })
        .then((doc) => {
          if (!doc) {
            return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError('Access to resource cannot be established'));
          }

          return S3Service.download(doc.publication.toString());
        })
        .then(({file, contentType}) => {
          /* TODO: set extension depending on type */
          scope.res.setHeader('Content-disposition', `attachment; filename=${_id}.pdf`);
          scope.res.setHeader('Content-type', contentType);
          scope.encoding = 'binary';
          return file;
        })
        .catch((err) => {
          return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError(err.message));
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
    handler: function getFile(scope) {
      const {_id} = scope.getParams();
      return this
        .locateModel(scope)
        .then((doc) => {
          return S3Service.download(doc._id.toString());
        })
        .then(({file, contentType}) => {
          /* TODO: set extension depending on type */
          scope.res.setHeader('Content-disposition', `attachment; filename=${_id}.pdf`);
          scope.res.setHeader('Content-type', contentType);
          scope.encoding = 'binary';
          return file;
        })
        .catch((err) => {
          return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError(err.message));
        });
    }
  }, 'getFile');

  restifizerController.actions.removeFile = restifizerController.normalizeAction({
    auth: [BaseController.AUTH.BEARER],
    method: 'post',
    path: ':_id/removeFile',
    handler: function removeFile(scope) {

      if (!scope.isAdmin()) {
        /* TODO: check if is student*/
        return Bb.reject(HTTP_STATUSES.FORBIDDEN.createError(`Only admins can remove publications files`));
      }

      const context = {};
      return this
        .locateModel(scope)
        .then((doc) => {
          context.doc = doc;
          return S3Service.removeObject(doc._id.toString());
        })
        .then(() => {
          return Publication.update({ _id: context.doc._id }, { $unset: { downloadUrl: 1 }});
        })
        .then(() => {
          const doc = context.doc.toObject();
          delete doc.downloadUrl;
          return doc;
        })
        .catch((err) => {
          return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError(err.message));
        });
    }
  }, 'removeFile');

}

module.exports.restifizer = restifizer;