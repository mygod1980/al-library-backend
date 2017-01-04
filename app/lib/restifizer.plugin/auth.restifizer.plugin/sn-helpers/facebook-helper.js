/**
 * Created by eugenia on 16/04/16.
 */
'use strict';

let crypto = require('crypto');
let _ = require('lodash');
let Bb = require('bluebird');

let requestJson = require('request-json');

let fbClient = requestJson.createClient('https://graph.facebook.com/');

let FIELDS = ['id', 'email'];

class FacebookHelper {

  constructor(options) {
    this.options = options || {};
  }

  getProfile(authData) {
    if (!authData.accessToken) {
      return Bb.reject(new Error('Missing required fields'));
    }

    const fieldsToFetch = this.options.fieldsToFetch || 'name';

    return fbClient
      .get(`me?fields=id,${fieldsToFetch},email&access_token=${authData.accessToken}`)
      .then((result) => {
        const res = result.res;
        const body = result.body;
        if (res.statusCode < 200 || res.statusCode > 299) {
          return Bb.reject(new Error('wrong response from FB'));
        }

        let hasMissedFields = _.find(FIELDS, (fieldName) => {
          return !body[fieldName];
        });

        return !hasMissedFields ? body : Bb.reject(new Error('Missing required fields from FB'));
      });
  }

  buildQuery(profile) {
    return {id: profile.id};
  }

  extract(profile) {
    return {
      username: profile.email,
      name: profile.name,
      firstName: profile['first_name'],
      lastName: profile['last_name']
    };
  }
}

module.exports = FacebookHelper;