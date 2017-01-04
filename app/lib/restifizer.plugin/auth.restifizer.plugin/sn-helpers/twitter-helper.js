/**
 * Created by eugenia on 16/04/16.
 */
'use strict';

let crypto = require('crypto');
let _ = require('lodash');
let Bb = require('bluebird');
var Twit = require('twit');

let FIELDS = ['id', 'name', 'screen_name'];

class TwitterHelper {
  
  constructor(options) {
    this.options = options || {};
  }

  getProfile(authData) {
    if (!authData.accessToken || !authData.accessSecret) {
      return Bb.reject(new Error('Missing required fields'));
    }

    var twit = new Twit({
      'consumer_key': this.options.key,
      'consumer_secret': this.options.secret,
      'access_token': authData.accessToken,
      'access_token_secret': authData.accessSecret
    });

    return twit.get('account/verify_credentials', {'skip_status': true})
      .then(function (result) {
        if (result.resp.statusCode < 200 || result.resp.statusCode > 299) {
          return Bb.reject(new Error('wrong response from Twitter'));
        }

        let hasMissedFields = _.find(FIELDS, (fieldName) => {
          return !result.data[fieldName]
        });

        return !hasMissedFields ? result.data : Bb.reject(new Error('Missing required fields from FB'));
      });
  }

  buildQuery(profile) {
    return {id: profile.id};
  }

  extract(profile) {
    return {
      username: profile['screen_name'],
      name: profile.name
    };
  }
}

module.exports = TwitterHelper;