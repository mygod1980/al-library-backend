/**
 * Created by eugenia on 16/04/16.
 */

'use strict';

let crypto = require('crypto');
let _ = require('lodash');
let Bb = require('bluebird');
let requestJson = require('request-json');

let googleClient = requestJson.createClient('https://www.googleapis.com/oauth2/v3/');

let FIELDS = ['sub', 'name', 'email'];

class GooglePlusHelper {

  constructor(options) {
    this.options = options || {};
  }

  getProfile(authData) {

    if (!authData.idToken) {
      return Bb.reject(new Error('Missing required fields'));
    }

    return googleClient
      .get(`tokeninfo?id_token=${authData.idToken}`)
      .then((result) => {
        const res = result.res;
        const body = result.body;
        if (res.statusCode < 200 || res.statusCode > 299) {
          return Bb.reject(new Error('wrong response from Google'));
        }

        if (!_.includes(this.options.audiences, body.aud)) {
          return Bb.reject(new Error('wrong credentials'));
        }

        if (1000 * body.exp < Date.now()) {
          return Bb.reject(new Error('token expired'));
        }

        let hasMissedFields = _.find(FIELDS, (fieldName) => {
          return !body[fieldName];
        });

        return !hasMissedFields ? body : Bb.reject(new Error('Missing required fields from Google'));
      });
  }

  buildQuery(profile) {
    return {id: profile.sub};
  }

  extract(profile) {
    return {
      username: profile.email,
      name: profile.name
    };
  }
}

module.exports = GooglePlusHelper;