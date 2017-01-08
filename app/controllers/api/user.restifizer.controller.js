/**
 * Created by eugenia on 02.01.2017.
 */

'use strict';

const _ = require('lodash');
const Bb = require('bluebird');

const HTTP_STATUSES = require('http-statuses');
const mongoose = require('config/mongoose');
const config = require('config/config');
const BaseController = require('app/lib/base.restifizer.controller');
const authPlugin = require('app/lib/restifizer.plugin/auth.restifizer.plugin');

const User = mongoose.model('User');
const RefreshToken = mongoose.model('RefreshToken');

/**
 * @apiDefine UserRequest
 * @apiParam {String} username email, used for signing in
 * @apiParam {String} password
 *
 */

/**
 * @apiDefine UserResponse
 * @apiSuccess {String} username email, used for signing in
 * @apiSuccess {String(ISODate)} createdAt
 * @apiSuccess {String(ISODate)} updatedAt
 */

/**
 * @apiGroup User
 * @apiName GetUsers
 * @api {get} /api/users Get User List
 * @apiDescription Returns array of users.
 * @apiPermission bearer, admin
 *
 * @apiParam {String} serviceKey serviceKey of service user belongs to

 * @apiUse BearerAuthHeader
 * @apiUse UserResponse
 */

/**
 * @apiGroup User
 * @apiName GetUser
 * @api {get} /api/users/:_id Get User
 * @apiDescription Returns user by id. Regular users can get only own profile.
 * @apiPermission bearer
 *
 * @apiParam {String} _id user id, you can use "me" shortcut.
 * @apiParam {String} serviceKey serviceKey of service user belongs to
 *
 * @apiUse BearerAuthHeader
 * @apiUse UserResponse
 */

/**
 * @apiGroup User
 * @apiName Create
 * @api {post} /api/users Create User
 * @apiDescription Creates a user.
 * @apiPermission client, bearer
 *
 * @apiUse ClientAuthParams
 * @apiUse BearerAuthHeader
 * @apiUse UserRequest
 * @apiUse UserResponse
 */

/**
 * @apiGroup User
 * @apiName UpdateUser
 * @api {patch} /api/users/:_id Update User
 * @apiDescription Updates user by id. Regular users can update only own profile.
 * @apiPermission bearer
 *
 * @apiParam {String} _id user id, you can use "me" shortcut.
 * @apiParam {String} serviceKey serviceKey of service user belongs to
 *
 * @apiUse BearerAuthHeader
 * @apiUse UserRequest
 * @apiUse UserResponse
 */

/**
 * @apiGroup User
 * @apiName RemoveUser
 * @api {delete} /api/users/:_id Remove User
 * @apiDescription Removes user by id. Regular users can remove only own profile.
 * @apiPermission bearer
 *
 * @apiParam {String} _id user id, you can use "me" shortcut.
 * @apiParam {String} serviceKey serviceKey of service user belongs to
 *
 * @apiUse BearerAuthHeader
 * @apiUse EmptySuccess
 */
class UserController extends BaseController {
  constructor(options = {}) {

    Object.assign(options, {
      dataSource: {
        type: 'mongoose',
        options: {
          model: User
        }
      },
      path: '/api/users',
      fields: [
        'role',
        'firstName',
        'lastName',
        'username',
        'password',
        'createdAt',
        'updatedAt',
        'auth'
      ],
      readOnlyFields: ['createdAt', 'updatedAt'],
      actions: {
        'default': BaseController.createAction({
          auth: [BaseController.AUTH.BEARER]
        })
      },

      plugins: [
        /**
         * @apiGroup User
         * @apiName LogoutUser
         * @api {post} /api/users/logout Logout User
         * @apiDescription Logs out the current user.
         * @apiPermission bearer
         *
         * @apiUse BearerAuthHeader
         * @apiUse EmptySuccess
         */

        /**
         * @apiGroup User
         * @apiName ChangeUserPassword
         * @api {post} /api/users/:_id/change-password Change User Password
         * @apiDescription Changes user password. Only owner or admin can change password.
         *
         * @apiParam {String} password the current password of the user
         * @apiParam {String} newPassword
         *
         * @apiPermission bearer
         *
         * @apiUse BearerAuthHeader
         * @apiUse EmptySuccess
         */

        /**
         * @apiGroup User
         * @apiName ForgotUserPassword
         * @api {post} /api/users/forgot Send Restoration Code
         * @apiDescription Initiates password restoration, sending reset code to email.
         * @apiPermission client
         * @apiParam {String} username email of a user, who restores password
         *
         * @apiUse ClientAuthParams
         * @apiUse EmptySuccess
         */

        /**
         * @apiGroup User
         * @apiName ResetUserPassword
         * @api {post} /api/users/reset/:token Reset User Password
         * @apiDescription Resets user password.
         * @apiPermission client
         *
         * @apiParam {String} token restoration token, received in email
         * @apiParam {String} newPassword new password
         *
         * @apiUse ClientAuthParams
         * @apiUse EmptySuccess
         */
        {
          plugin: authPlugin.restifizer,
          options: {
            Model: User,
            authenticate: function (doc, scope) {
              return this._authenticate(doc, scope)
            },
            sns: {
              facebook: {
                fieldsToFetch: 'first_name,last_name'
              }
            }
          }
        }
      ]
    });

    super(options);

    const expressTransport = _.find(this.transports, {transportName: 'express'});
    this.authDelegate = expressTransport.app.oAuthifizer.authDelegate;
    if (!this.authDelegate) {
      throw new Error('"authDelegate" must be provided');
    }
  }

  assignFilter(queryParams, fieldName, scope) {
    return (!scope.isUpdate() || fieldName !== 'password') &&
      super.assignFilter(queryParams, fieldName, scope);
  }

  pre(scope) {
    const params = scope.getParams();
    const user = scope.getUser();

    if (params._id === 'me') {
      params._id = user.id;
    }

    if (scope.isInsert() && !scope.isAdmin()) {
      return Bb.reject(HTTP_STATUSES.FORBIDDEN.createError('Only admins can create new users'));
    }

    if (scope.isSelect() && !scope.isSelectOne() && !scope.isAdmin()) {
      return Bb.reject(HTTP_STATUSES.FORBIDDEN.createError());
    }

    if (params._id && !user._id.equals(params._id) && !scope.isAdmin()) {
      return Bb.reject(HTTP_STATUSES.FORBIDDEN.createError());
    }
  }

  post(user, scope) {
    if (scope.isInsert() && scope.context.auth) {
      user.auth = scope.context.auth;
    }

    delete user.hashedPassword;

    return user;
  }

  _authenticate(user, scope) {
    scope.setUser(user);
    return Bb
      .try(() => {
        const client = this.getClient(scope);
        if (!client && scope.getUser() && scope.isAdmin()) {
          // for admins we're fetching client data from the request
          return this.authDelegate
            .findClient({
              clientId: scope.getBody()['client_id'],
              clientSecret: scope.getBody()['client_secret']
            });
        } else {
          return client;
        }
      })
      .then((client) => {
        if (client) {

          return Bb.join(
            this.authDelegate.createAccessToken({user}),
            this.authDelegate.createRefreshToken({
              user,
              client
            }))
            .spread((accessToken, refreshToken) => {
              return {
                'access_token': accessToken,
                'refresh_token': refreshToken.token,
                'expires_in': config.security.tokenLife,
                'token_type': 'bearer'
              };
            });
        }
      });
  }

}

module.exports = UserController;
