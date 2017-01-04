'use strict';

const _ = require('lodash');
const chakram = require('chakram');

const mongoose = require('config/mongoose');
const config = require('test/config');
const userSnData = require('test/data/user-sn.data');
const specHelper = require('test/spec-helper');

const User = mongoose.model('User');
const expect = chakram.expect;

describe('User SN', () => {

  let fb1 = userSnData.facebook[0];
  let fb2 = userSnData.facebook[1];
  let twitter = userSnData.twitter[0];
  let google = userSnData.google[0];
  let fbUser1 = {};
  let fbUser2 = {};
  let twUser1 = {};
  let gpUser1 = {};

  describe('Sign In new user', () => {

    let response;

    before('send post', () => {
      return chakram
        .post(`${config.baseUrl}/api/users/snAuth/facebook`, Object.assign({}, fb1, specHelper.getClientAuth()))
        .then((result) => {
          response = result;
        });
    });

    before('get user profile', () => {
      fbUser1.auth = response.body;
      return specHelper
        .getUser(fbUser1, fbUser1, 'me')
        .then((result) => {
          Object.assign(fbUser1, _.pick(result, 'username', 'name'));
        });
    });

    it('should return status 200', () => {
      return expect(response).to.have.status(200);
    });

    it('access_token should exist', () => {
      return expect(response.body['access_token']).to.exist;
    });

    it('should have same username', () => {
      expect(fbUser1.username).to.be.equal(fb1.auth.email);
    });

    it('should have same name', () => {
      expect(fbUser1.name).to.be.equal(fb1.auth.name);
    });

  });

  describe('Sign In with the same data', () => {

    let response;
    let tmpUser = {};

    before('send post', () => {
      return chakram
        .post(`${config.baseUrl}/api/users/snAuth/facebook`, Object.assign({}, fb1, specHelper.getClientAuth()))
        .then((result) => {
          response = result;
        });
    });

    before('get user profile', () => {
      tmpUser.auth = fbUser1.auth = response.body;
      return specHelper
        .getUser(tmpUser, tmpUser, 'me')
        .then((result) => {
          Object.assign(tmpUser, _.pick(result, 'username', 'name'));
        });
    });

    it('should return status 200', () => {
      return expect(response).to.have.status(200);
    });

    it('should have the same user _id', () => {
      return expect(response.body['access_token']).to.exist;
    });

  });

  describe('Sign In with other sn but the same email', () => {

    let response;

    before('send post', () => {
      const userData = Object.assign({}, google, specHelper.getClientAuth());
      userData.auth.email = fbUser1.username;
      return chakram
        .post(`${config.baseUrl}/api/users/snAuth/google`, userData)
        .then((result) => {
          response = result;
        });
    });

    it('should return status 400', () => {
      return expect(response).to.have.status(400);

    });
  });

  describe('Link another sn', () => {

    let response;

    before('send post', () => {
      return chakram
        .put(`${config.baseUrl}/api/users/me/linked-accounts/twitter`,
          twitter,
          {
            headers: {
              'Authorization': `Bearer ${fbUser1.auth['access_token']}`
            }
          })
        .then((result) => {
          response = result;
        });
    });

    it('should return status 204', () => {
      return expect(response).to.have.status(204);
    });

  });

  describe('Link same sn second time to other user', () => {

    let response;

    before('Sign In secondary user', () => {
      return specHelper
        .signInSocial('facebook', fb2, fbUser2)
        .then(() => {
          return specHelper.getUser(fbUser2, fbUser2, 'me');
        })
        .then((result) => {
          Object.assign(fbUser2, _.pick(result, 'username', 'name'));
        });
    });

    before('send post', () => {
      return chakram
        .put(`${config.baseUrl}/api/users/me/linked-accounts/twitter`,
          twitter,
          {
            headers: {
              'Authorization': `Bearer ${fbUser2.auth['access_token']}`
            }
          })
        .then((result) => {
          response = result;
        });
    });

    it('should return status 400', () => {
      return expect(response).to.have.status(400);
    });

  });

  describe('Sign In with linked sn', () => {

    let response;

    before('send post', () => {
      return chakram
        .post(`${config.baseUrl}/api/users/snAuth/twitter`,
          Object.assign({}, twitter, specHelper.getClientAuth()))
        .then((result) => {
          response = result;
        });
    });

    before('get user profile', () => {
      twUser1.auth = fbUser1.auth = response.body;
      return specHelper
        .getUser(twUser1, twUser1, 'me')
        .then((result) => {
          Object.assign(twUser1, _.pick(result, 'username', 'name'));
        });
    });

    it('should return status 200', () => {
      return expect(response).to.have.status(200);
    });

    it('should have the same user _id', () => {
      return expect(twUser1._id).to.be.equal(fbUser1._id);
    });

  });

  describe('Unlink another sn', () => {

    let response;

    before('send post', () => {
      return chakram
        .delete(`${config.baseUrl}/api/users/me/linked-accounts/twitter`,
          twitter,
          {
            headers: {
              'Authorization': `Bearer ${fbUser1.auth['access_token']}`
            }
          })
        .then((result) => {
          response = result;
        });
    });

    it('should return status 204', () => {
      return expect(response).to.have.status(204);
    });

  });


  after('remove user', () => {
    return specHelper.removeUser(fbUser1);
  });

  after('remove user', () => {
    return specHelper.removeUser(fbUser2);
  });

});
