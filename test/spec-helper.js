/**
 * Created by vedi on 08/07/16.
 */

'use strict';

const _ = require('lodash');
const Bb = require('bluebird');
const request = require('request-promise');

const mongoose = require('config/mongoose');
const config = require('config/config');
const testConfig = require('test/config');

const User = mongoose.model('User');
const RefreshToken = mongoose.model('RefreshToken');

const FIXTURE_TYPES = {
  USER: 'user.data',
  USER_SN: 'user-sn.data'
};

const clientAuth = {
  'client_id': testConfig.client.clientId,
  'client_secret': testConfig.client.clientSecret
};

const specHelper = {

  FIXTURE_TYPES: FIXTURE_TYPES,

  get(uri, options) {
    return this.request('GET', uri, undefined, options);
  },
  post(uri, body, options) {
    return this.request('POST', uri, body, options);
  },
  patch(uri, body, options) {
    return this.request('PATCH', uri, body, options);
  },
  put(uri, body, options) {
    return this.request('PUT', uri, body, options);
  },
  'delete'(uri, body, options) {
    return this.request('DELETE', uri, body, options);
  },
  request(method, uri, body, options) {
    options = Object.assign({
      method: method,
      uri,
      body,
      resolveWithFullResponse: true,
      // simple: false,
      json: true
    }, options);

    return request(options);
  },

  getFixture(fixtureType, seed) {
    const fixtureProvider = require(`./data/${fixtureType}`);
    if (_.isArray(fixtureProvider)) {
      if (_.isUndefined(seed)) {
        seed = Math.floor(Math.random() * fixtureProvider.length);
      } else if (!_.isNumber(seed) || seed >= fixtureProvider.length) {
        throw new Error(`Wrong seed value: ${seed}`);
      }

      return Object.assign({}, fixtureProvider[seed]);
    } else if (_.isFunction(fixtureProvider)) {
      seed = seed || Math.floor(Math.random() * 1000000);
      return fixtureProvider(seed);
    } else {
      throw new Error(`Unsupported fixture provider: ${fixtureType}`);
    }
  },

  getClientAuth() {
    return Object.assign({}, clientAuth);
  },
  getBasicAuth(client) {

    let clientId = client ? client.clientId : clientAuth['client_id'];
    let clientSecret = client ? client.clientSecret : clientAuth['client_secret'];

    return Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  },

  getAdminUser() {
    return Object.assign({role: config.roles.ADMIN}, testConfig.user);
  },

  fetchAndClearSentEmails() {
    return this
      .get(`${testConfig.baseUrl}/testing/sent-emails`)
      .then((result) => {
        return result.body;
      });
  },

  createUser(data) {
    return this
      .post(`${testConfig.baseUrl}/api/users`, Object.assign({}, data, this.getClientAuth()))
      .then((result) => {
        data._id = result.body._id;
        return result.body;
      });
  },

  signInUser(data) {
    return this
      .post(`${testConfig.baseUrl}/oauth`,
        Object.assign({
          'grant_type': 'password'
        }, _.pick(data, 'username', 'password'), this.getClientAuth()))
      .then((result) => {
        data.auth = {
          'access_token': result.body['access_token'],
          'refresh_token': result.body['refresh_token']
        };

        return result.body;
      });
  },

  signInSocial(sn, data, userData) {
    return this
      .post(`${testConfig.baseUrl}/api/users/snAuth/${sn}`,
        Object.assign({}, data, this.getClientAuth()))
      .then((result) => {
        userData.auth = {
          'access_token': result.body['access_token'],
          'refresh_token': result.body['refresh_token']
        };
        return result.body;
      });
  },

  getUser(userData, data, userId) {
    data = data || userData;
    userId = userId || data._id;
    return this
      .get(`${testConfig.baseUrl}/api/users/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${userData.auth['access_token']}`
          }
        })
      .then((result) => {
        data._id = result.body._id;
        return result.body;
      });

  },

  removeUser(data) {
    return Bb
      .try(() => {
        if (data._id) {
          return User.remove({_id: data._id});
        }
      });
  },

  runJob(name, data) {
    return this
      .post(
        `${testConfig.baseUrl}/jobs/${name}`,
        data
      );
  }

};

before(() => {
  return Bb
    .join(
      User.remove({username: {$ne: config.defaultUser.username}}),
      RefreshToken.remove({})
    );

});

module.exports = specHelper;
