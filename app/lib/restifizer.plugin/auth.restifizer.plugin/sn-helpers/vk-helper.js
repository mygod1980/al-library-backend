/**
 * Created by eugenia on 16/04/16.
 */
'use strict';

const crypto = require('crypto');
const _ = require('lodash');
const Bb = require('bluebird');
const VK = require('vksdk');

const FIELDS = ['id', 'first_name', 'last_name'];

class VkHelper {

  constructor(options) {
    this.options = options || {};
  }

  getProfile(authData) {
    
    const options = this.options;

    let vk = new VK({
      'appId'     : options.appId,
      'appSecret' : options.appSecret,
      'https'  : true,
      'secure'  : true
    });

    if (!authData.accessToken) {
      return Bb.reject(new Error('Missing "accessToken"'));
    }
    vk.setToken(authData.accessToken);

    return new Bb(
      
      (resolve, reject) => {

        vk.on('http-error', reject);
        vk.on('parse-error', reject);

        vk.request('users.get', {sig: authData.sig}, resolve);
      })
      .catch(() => {
        return Bb.reject(new Error('wrong response from VK'));
      })
      .then((body) => {
        if (body.error) {
          return Bb.reject(new Error(body.error['error_msg']));
        }

        let result = body.response[0];

        let hasMissedFields = _.find(FIELDS, (fieldName) => {
          return !result[fieldName];
        });

        if (hasMissedFields) {
          return Bb.reject(new Error('Missing required fields from VK'));
        }

        return {
          id: result.id,
          email: authData.email,
          name: `${result['first_name']} ${result['last_name']}`
        };
      });
  }

  buildQuery(profile) {
    return {id: profile.id};
  }

  extract(profile) {
    return {
      username: profile.email,
      name: profile.name
    };
  }
}

module.exports = VkHelper;