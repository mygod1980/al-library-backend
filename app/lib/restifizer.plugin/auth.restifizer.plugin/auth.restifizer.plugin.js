/**
 * Created by eugenia on 02/07/16.
 */

'use strict';

const crypto = require('crypto');
const _ = require('lodash');
const Bb = require('bluebird');
const HTTP_STATUSES = require('http-statuses');

const config = require('config/config');
const eventBus = require('config/event-bus');
const LOCAL_PROVIDER = 'local';

const requiredForLocalProvider = function requiredForLocalProvider() {
  return this.provider === LOCAL_PROVIDER;
};

function mongooseFn(schema, options) {

  const mongoose = options.mongoose;

  schema.add({
    username: {
      type: String,
      unique: 'User with this username already exists',
      sparse: true,
      required: [
        requiredForLocalProvider,
        'Path `{PATH}` is required.'
      ],
      trim: true,
      lowercase: true
    },
    hashedPassword: {
      type: String,
      default: '',
      required: [
        requiredForLocalProvider,
        'Path `{PATH}` is required.'
      ]
    },
    salt: {
      type: String
    },

    provider: {
      type: String,
      'default': LOCAL_PROVIDER,
      required: true
    },
    resetPassword: {
      token: String,
      expires: Date
    },
    linkedAccounts: {}
  });

  /**
   * Create instance method for hashing a password
   */
  schema.methods.hashPassword = function (password) {
    if (this.salt && password) {
      return crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha1').toString('base64');
    } else {
      return password;
    }
  };

  /**
   * Create instance method for authenticating user
   */
  schema.methods.authenticate = function (password) {
    return this.hashedPassword === this.hashPassword(password);
  };

  schema.statics.logout = function logout(userId) {

    const RefreshToken = mongoose.model('RefreshToken');

    // remove tokens
    return RefreshToken.remove({userId});

  };

  schema
    .virtual('password')
    .set(function (password) {
      this._plainPassword = password;
      this.salt = Buffer.alloc(24, crypto.randomBytes(16).toString('base64'));
      this.hashedPassword = this.hashPassword(password);
    })
    .get(function () {
      return this._plainPassword;
    });

}

function restifizer(restifizerController, options) {

  let Model = options.Model;
  let authenticate = options.authenticate;
  let profileFilter = options.profileFilter;

  function normalize(sn, query) {
    const prefix = `linkedAccounts.${sn}`;
    const result = {};
    _.forEach(query.linkedAccounts[sn], (value, key) => {
      result[`${prefix}.${key}`] = value;
    });
    return result;
  }

  restifizerController.snHelpers = {};

  const sns = options.sns;
  if (config.isTest) {
    restifizerController.snHelpers.emulation = {
      getProfile(authData) {
        if (!authData) {
          return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError('No emulation data provider'));
        }

        return Bb.resolve({
          id: authData.id,
          email: authData.email,
          name: authData.name,
          firstName: authData.firstName,
          lastName: authData.lastName
        });
      },
      buildQuery(profile) {
        return {id: profile.id};
      },
      extract(profile) {
        return {
          username: profile.email,
          name: profile.name,
          firstName: profile.firstName,
          lastName: profile.lastName
        };
      }
    };
  } else if (sns) {
    if (sns.facebook) {
      restifizerController.snHelpers.facebook = new (require('./sn-helpers/facebook-helper'))(sns.facebook);
    }

    if (sns.google) {
      restifizerController.snHelpers.google = new (require('./sn-helpers/google-plus-helper'))(sns.google);
    }

    if (sns.twitter) {
      restifizerController.snHelpers.twitter = new (require('./sn-helpers/twitter-helper'))(sns.twitter);
    }

    if (sns.vk) {
      restifizerController.snHelpers.vk = new (require('./sn-helpers/vk-helper'))(sns.vk);
    }
  }

  restifizerController.getSnHelper = function (sn) {
    if (!config.isTest) {
      return this.snHelpers[sn];
    } else {
      return this.snHelpers.emulation;
    }
  };

  restifizerController.actions.snAuth = restifizerController.normalizeAction({
    auth: ['oauth2-client-password'],
    method: 'post',
    path: 'snAuth/:sn',
    handler: function snAuth(scope) {
      let sn = scope.req.params.sn;
      let snHelper = this.getSnHelper(sn);
      if (!snHelper) {
        return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError('Unsupported "sn" value'));
      }

      let profile;
      let query = {
        role: scope.req.body.role,
        linkedAccounts: {}
      };

      return snHelper
        .getProfile(scope.req.body.auth)
        .then((result) => {
          profile = result;
          query.linkedAccounts[sn] = snHelper.buildQuery(profile);
          return Model.findOne(normalize(sn, query));
        })
        .then((doc) => {
          if (!doc) {
            query.provider = sn;

            let userData = snHelper.extract(profile);
            if (_.isFunction(profileFilter)) {
              userData = profileFilter.apply(this, userData);
            }

            _.extend(query, userData);
            return Model.create(query);
          } else {
            doc.set(`linkedAccounts.${sn}`, query.linkedAccounts[sn]);
            return doc.save();
          }
        })
        .then((doc) => {
          if (_.isFunction(authenticate)) {
            return authenticate.call(this, doc, scope);
          }
        })
        .catch((err) => {
          return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError(err.message));
        });
    }
  }, 'snAuth');

  restifizerController.actions.linkAccount = restifizerController.normalizeAction({
    method: 'put',
    path: ':_id/linked-accounts/:sn',
    handler: function linkAccount(scope) {

      let sn = scope.req.params.sn;
      delete scope.req.params.sn;

      let profile;
      let query = {'linkedAccounts': {}};

      return this.locateModel(scope)
        .then((doc) => {
          scope.affectedDoc = doc;

          let snHelper = this.getSnHelper(sn);
          if (!snHelper) {
            return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError('Unsupported "sn" value'));
          }
          scope.snHelper = snHelper;
          return snHelper.getProfile(scope.req.body.auth);
        })
        .then((result) => {
          profile = result;
          query.linkedAccounts[sn] = scope.snHelper.buildQuery(profile);
          return Model.findOne(normalize(sn, query));
        })
        .then((doc) => {
          // check, if somebody else linked with this data
          if (doc) {
            if (doc.id === scope.affectedDoc.id) {
              return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError('User is already linked this account'));
            } else {
              return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError('Other user is already linked this account'));
            }
          }

          scope.affectedDoc.set(`linkedAccounts.${sn}`, query.linkedAccounts[sn]);

          return scope.affectedDoc.save();
        })
        .then(() => {
          scope.res.statusCode = HTTP_STATUSES.NO_CONTENT.code;
        });
    }
  }, 'linkAccount');

  restifizerController.actions.unlinkAccount = restifizerController.normalizeAction({
    method: 'delete',
    path: ':_id/linked-accounts/:sn',
    handler: function linkAccount(scope) {

      let sn = scope.req.params.sn;
      delete scope.req.params.sn;

      return this
        .locateModel(scope)
        .then((doc) => {
          scope.affectedDoc = doc;

          let snHelper = this.getSnHelper(sn);
          if (!snHelper) {
            return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError('Unsupported "sn" value'));
          }

          if (doc.provider === sn) {
            return Bb.reject(HTTP_STATUSES.BAD_REQUEST.createError('You cannot unlink account used in signing up'));
          }

          doc.set(`linkedAccounts.${sn}`, undefined);

          return doc.save();
        })
        .then(() => {
          scope.res.statusCode = HTTP_STATUSES.NO_CONTENT.code;
        });
    }
  }, 'unlinkAccount');

  restifizerController.actions.logout = restifizerController.normalizeAction({
    auth: ['bearer'],
    method: 'post',
    path: 'logout',
    handler: function logout(scope) {
      const userId = scope.getUser()._id;

      if (!userId) {
        HTTP_STATUSES.FORBIDDEN.createError();
      }

      return Model
        .logout(userId)
        .then(() => {
          return undefined;
        });
    }
  }, 'logout');

  restifizerController.actions.changePassword = restifizerController.normalizeAction({
    auth: ['bearer'],
    method: 'post',
    path: ':_id/change-password',
    handler: function changePassword(scope) {
      const body = scope.getBody();
      const user = scope.getUser();

      return Bb
        .try(() => {
          const password = body['password'];
          const newPassword = body['newPassword'];
          if (!password || !newPassword) {
            throw HTTP_STATUSES.BAD_REQUEST.createError();
          }

          if (!user.authenticate(password)) {
            throw HTTP_STATUSES.BAD_REQUEST.createError('Bad password');
          }

          user.password = newPassword;
          return user.save();
        })
        .then(() => {
          return undefined;
        });
    }
  }, 'changePassword');

  restifizerController.actions.forgot = restifizerController.normalizeAction({
    auth: ['oauth2-client-password'],
    method: 'post',
    path: 'forgot',
    handler: function forgot(scope) {
      const body = scope.getBody();
      const context = scope.context;

      return Bb
        .try(() => {
          const username = body['username'];
          if (!username) {
            throw HTTP_STATUSES.BAD_REQUEST.createError('No username provided');
          }

          return Model.findOne({
            username: username.toLowerCase()
          });
        })
        .then((user) => {
          if (!user) {
            throw HTTP_STATUSES.BAD_REQUEST.createError('Invalid username');
          }

          context.user = user;

          return Bb.fromCallback((callback) => {
            crypto.randomBytes(20, callback);
          });
        })
        .then((buffer) => {
          context.user.resetPassword = {
            token: buffer.toString('hex'),
            expires: Date.now() + 1000 * config.security.tokenLife
          };

          return context.user.save();
        })
        .then(() => {
          eventBus.emit(eventBus.EVENTS.FORGOT_PASSWORD, {
            user: context.user,
            url: config.urls.resetPassword
          });

          return undefined;
        });
    }
  }, 'forgot');

  restifizerController.actions.reset = restifizerController.normalizeAction({
    auth: ['oauth2-client-password'],
    method: 'post',
    path: 'reset/:token',
    handler: function reset(scope) {
      const context = scope.context;

      return Model
        .findOne({
          'resetPassword.token': scope.getParams().token,
          'resetPassword.expires': {
            $gt: new Date()
          }
        })
        .then((user) => {
          if (!user) {
            throw HTTP_STATUSES.BAD_REQUEST.createError('Password reset token is invalid or has expired.');
          }

          context.user = user;

          user.password = scope.getBody().newPassword;
          user.resetPassword = undefined;

          return user.save();
        })
        .then(() => {
          eventBus.emit(eventBus.EVENTS.RESET_PASSWORD, {user: context.user});

          return undefined;
        });
    }
  }, 'reset');

}

module.exports.restifizer = restifizer;
module.exports.mongoose = mongooseFn;

