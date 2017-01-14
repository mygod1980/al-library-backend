/**
 * Created by eugenia on 19/09/14.
 */
'use strict';

const util = require('util');
const Bb = require('bluebird');
const crypto = require('crypto');
const jsonwebtoken = require('jsonwebtoken');
const HTTP_STATUSES = require('http-statuses');

const log = require('config/log')(module);
const config = require('config/config');
const mongoose = require('config/mongoose');
const User = mongoose.model('User');
const Client = mongoose.model('Client');
const RefreshToken = mongoose.model('RefreshToken');

class AuthDelegate {
  constructor() {
    this.tokenLife = config.security.tokenLife;
    this.oAuthifizer = undefined;
  }

  /**
   * Create authorization code
   * @param context value object containing: user, client, scope, redirectUri, codeValue
   * @return Promise
   */
  createAuthorizationCode(context) {
    return Bb.reject(HTTP_STATUSES.NOT_ACCEPTABLE.createError());
  }

  /**
   * Get authorization code object
   * @param context value object containing: codeValue, client, redirectUri
   * @return Promise with authorization code object if found, null - if not found
   */
  findAuthorizationCode(context) {
    return Bb.reject(HTTP_STATUSES.NOT_ACCEPTABLE.createError());
  }

  /**
   * Get user object
   * @param context value object containing: id | (login, password)
   * @return Promise with user model if found, null - if not found
   */
  findUser(context) {
    if (context.id) {
      return User.findById(context.id);
    } else if (context.login && context.password) {
      return User.findOne({username: context.login.toLowerCase(), suspendedAt: {$exists: false}})
        .then((user) => {
          if (!user || !user.authenticate(context.password)) {
            return null;
          }

          return user;
        })
        .catch((err) => {
          log.error(err);
          throw err;
        });
    } else {
      return Bb.reject(new Error('Wrong context!'));
    }
  }

  /**
   * Get user data by token
   * @param context value object containing: accessToken | refreshToken
   * @return Promise with object with user, and info; or null - if not found
   */
  findUserByToken(context) {

    const accessToken = context.accessToken;
    const refreshToken = context.req.body['refresh_token'];
    return Bb.try(() => {
      if (accessToken) {
        return accessToken;
      } else if (refreshToken) {
        return RefreshToken.findOne({token: refreshToken});
      } else {
        throw new Error('Wrong context!');
      }
    })
      .then((token) => {
        if (token) {

          if (token.userId) {
            // it's refresh token
            return User.findById(token.userId)
              .then((user) => {
                if (!user) {
                  log.error('Unknown user');
                  return {obj: false};
                }
                const info = {scope: token.scopes};

                return {obj: user, info: info};

              });
          }

          const result = {};

          return Bb.fromCallback((callback) => {
            return jsonwebtoken.verify(token, config.security.jwtSignature, callback);
          })
            .then((doc) => {
              result.info = {scope: doc.scopes};
              delete doc.scopes;
              const Model = doc.clientId ? Client : User;
              result.obj = Model.hydrate(doc);

              if (doc.role) {
                // check if role is the same as in db or user really exists
                return Model.findById(doc._id)
                  .then((user) => {
                    if (!user || doc.role !== user.role) {
                      return {obj: false};
                    }

                    return result;
                  });
              }

              return result;
            });
        } else {
          return {obj: false};
        }
      });
  }

  /**
   * Get client object
   * @param context value object containing: clientId, clientSecret,
   * if clientSecret is false we do not need to check it
   * @return Promise with client model if found, false - if not found
   */
  findClient(context) {
    return Client.findOne({clientId: context.clientId})
      .then(function (client) {
        if (client && (context.clientSecret === false || client.clientSecret === context.clientSecret)) {
          return client;
        } else {
          return false;
        }
      });
  }

  /**
   * Clean up tokens
   * @param context value object containing: user|authorizationCode, client
   * @return Promise with no params
   */
  cleanUpTokens(context) {
    const userId = context.user ? context.user._id : context.authorizationCode.userId;

    return RefreshToken.remove({userId});
  }

  /**
   * Generate token value string.
   * @param {object} context user or client model
   * @returns {String} tokenValue
   */
  createAccessToken(context) {
    let {user, client: client} = context;

    return Bb
      .try(() => {
        // for implicit we generate token from client
        if (user) {
          return Client.findOne({clientId: config.defaultClient.clientId});
        }

        return client;
      })
      .then((doc) => {
        if (!doc) {
          throw new Error('Unknown client');
        }

        if (user.toObject) {
          user = user.toObject();
        }

        return Bb.fromCallback((callback) => {
          return jsonwebtoken.sign(user || client, config.security.jwtSignature, {expiresIn: this.tokenLife}, callback);
        });

      });
  }

  /**
   * Create tokens by user and client
   * @param context value object containing: user|authorizationCode, client, scope, tokenValue, refreshTokenValue
   * @return Promise with no params
   */
  createRefreshToken(context) {

    return Bb
      .try(() => {
        if (context.user) {
          return context.user;
        } else {
          return User.findById(context.authorizationCode.userId);
        }
      })
      .then((user) => {
        if (!user) {
          throw new Error('Unknown user');
        }
        context.user = user;
      })
      .then(() => {
        const refreshToken = {
          token: crypto.randomBytes(32).toString('base64'),
          clientId: config.defaultClient.clientId,
          userId: context.user._id
        };
        return RefreshToken.create(refreshToken);
      })
      .then((doc) => {
        return doc.token;
      });
  }

  /**
   * Get additional token info.
   * @param context value object, containing: client, scope, tokenValue, refreshTokenValue, user|authorizationCode
   * @return Promise with an arbitrary object
   */
  getTokenInfo(context) {
    return Bb
      .try(() => {
        if (context.user) {
          return context.user;
        } else {
          return User.findById(context.authorizationCode.userId);
        }
      })
      .then((user) => {
        if (!user) {
          throw new Error('Unknown user');
        }
        return {'expires_in': this.tokenLife};
      });
  }

  ensureLoggedIn(req, res, next) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      this._redirectToLogin(req, res);
    } else {
      next();
    }
  }

  approveClient() {
    return [
      (req, res, next) => {
        req.params.transactionID = req.oauth2.transactionID;
        next();
      },
      this.oAuthifizer.getDecision()
    ];
  }

}

module.exports = AuthDelegate;
