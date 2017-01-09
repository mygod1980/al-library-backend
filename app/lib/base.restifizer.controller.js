/**
 * Created by eugenia on 07/05/16.
 */
'use strict';

const _ = require('lodash');
const Restifizer = require('restifizer');
const config = require('config/config');
const User = require('config/mongoose').model('User');

const defaultAction = {
  enabled: true,
  auth: ['bearer']
};

/**
 * @apiDefine bearer used, when user already authenticated
 */

/**
 * @apiDefine client used for not authenticated requests
 */

/**
 * @apiDefine BearerAuthHeader used, when user already authenticated
 * @apiHeader {String} Authorization access token value in format: "Bearer {{accessToken}}".
 */

/**
 * @apiDefine ClientAuthParams used for not authenticated requests
 * @apiParam {String} client_id
 * @apiParam {String} client_secret
 */

/**
 * @apiDefine EmptySuccess
 * @apiSuccess (204) {empty} empty
 */

/**
 * @apiDefine AuthSuccess
 * @apiSuccess {String} access_token
 * @apiSuccess {String} refresh_token
 * @apiSuccess {Number} expires_in
 * @apiSuccess {String=bearer} token_type
 */

/**
 * @apiGroup OAuth2
 * @apiName GetTokenWithPassword
 * @api {post} /oauth Sign in
 * @apiUse ClientAuthParams
 * @apiParam {String=password} grant_type
 * @apiParam {String} username
 * @apiParam {String} password
 * @apiUse AuthSuccess
 */

/**
 * @apiGroup OAuth2
 * @apiName GetTokenWithRefreshToken
 * @api {post} /oauth Refresh token
 * @apiUse ClientAuthParams
 * @apiParam {String=refresh_token} grant_type
 * @apiParam {String} refresh_token
 * @apiUse AuthSuccess
 */

class BaseController extends Restifizer.Controller {

  constructor(options) {
    super(options || {actions: {'default': defaultAction}});
  }

  static createAction(options) {
    return _.defaults(options, defaultAction);
  }

  static getName() {
    return this.name.charAt(0).toLowerCase() + this.name.replace('Controller', '').slice(1)
  }


  getClient(scope) {
    return scope.getClient();
  }

  createScope(controller, transport) {
    const result = super.createScope(controller, transport);

    if (transport.transportName === 'express') {
      result.getUser = function getUser() {
        return result.transportData.req.user;
      };
      result.getClient = function getClient() {
        const user = this.getUser();
        return user && user.clientId ? user : undefined;
      };

      result.setUser = function setUser(user) {
        // Do nothing, oAuthifizer will inject user by access token in every request
      };
      result.getSocket = function getSocket() {
        return null;
      };

      result.isAdmin = function () {
        const user = this.getUser();
        return user && user.role === config.roles.ADMIN;
      };

    } else if (transport.transportName === 'socket.io') {
      result.user = false;
      result.getUser = function getUser() {
        return result.transportData.socket.handshake.user;
      };
      result.getClient = function getClient() {
        return result.transportData.socket.handshake.client;
      };
      result.setUser = function setUser(user) {
        // TODO: update it, when user is updated
        result.transportData.socket.handshake.user = user;
        return user;
      };
      result.getSocket = function getSocket() {
        return result.transportData.socket;
      };

      result.isAdmin = function () {
        const user = this.getUser();
        return user && user.role === config.roles.ADMIN;
      };

    } else {
      throw new Error(`Unsupported transport: ${transport.transportName}`);
    }

    return result;
  }
}

BaseController.AUTH = {
  BASIC: 'basic',
  BEARER: 'bearer',
  CLIENT: 'oauth2-client-password'
};

module.exports = BaseController;
