'use strict';

const _ = require('lodash');
const chakram = require('chakram');

const mongoose = require('config/mongoose');
const config = require('test/config');
const specHelper = require('test/spec-helper');

const User = mongoose.model('User');
const expect = chakram.expect;

describe('User profile', () => {

  const adminUser = specHelper.getAdminUser();
  const user = specHelper.getFixture(specHelper.FIXTURE_TYPES.USER);

  before('sign in admin', () => {
    return specHelper.signInUser(adminUser);
  });

  describe('Sign up', () => {

    let response;

    before('send post', () => {
      return chakram
        .post(`${config.baseUrl}/api/users`, Object.assign({}, user, specHelper.getClientAuth()))
        .then((result) => {
          response = result;
        });
    });

    it('should return status 201', () => {
      return expect(response).to.have.status(201);
    });

    it('should contain _id', () => {
      user._id = response.body._id;
      return expect(response.body._id).to.exist;
    });
  });

  describe('Sign in', () => {

    let response;

    before('send post', () => {
      return chakram
        .post(`${config.baseUrl}/oauth`,
          Object.assign({
            "grant_type": "password"
          }, _.pick(user, 'username', 'password'), specHelper.getClientAuth()))
        .then((result) => {
          response = result;
        });
    });

    it('should return status 200', () => {
      expect(response).to.have.status(200);
      user.auth = _.pick(response.body, 'access_token', 'refresh_token');
    });

  });

  describe('Get List by admin', () => {

    let response;

    before('send request', () => {
      return chakram
        .get(`${config.baseUrl}/api/users`,
          {
            headers: {
              'Authorization': `Bearer ${adminUser.auth['access_token']}`
            }
          })
        .then((result) => {
          response = result;
        });
    });

    it('should return status 200', () => {
      expect(response).to.have.status(200);
    });

  });

  describe('Get List by user', () => {

    let response;

    before('send request', () => {
      return chakram
        .get(`${config.baseUrl}/api/users`,
          {
            headers: {
              'Authorization': `Bearer ${user.auth['access_token']}`
            }
          })
        .then((result) => {
          response = result;
        });
    });

    it('should return status 403', () => {
      expect(response).to.have.status(403);
    });

  });

  describe('Get Profile', () => {

    let response;

    before('send request', () => {
      return chakram
        .get(`${config.baseUrl}/api/users/me`,
          {
            headers: {
              'Authorization': `Bearer ${user.auth['access_token']}`
            }
          })
        .then((result) => {
          response = result;
        });
    });

    it('should return status 200', () => {
      expect(response).to.have.status(200);
    });

    it('should be the same _id', () => {
      expect(response).to.have.json('_id', user._id);
    });

    it('should be the same username', () => {
      expect(response).to.have.json('username', user.username.toLowerCase());
    });

    it('should be the same firstName', () => {
      expect(response).to.have.json('firstName', user.firstName);
    });

    it('should be the same lastName', () => {
      expect(response).to.have.json('lastName', user.lastName);
    });

  });

  describe('Change Profile', () => {

    const NEW_FIRST_NAME = 'new-first-name';

    let response;

    before('send request', () => {

      return chakram
        .patch(`${config.baseUrl}/api/users/me`,
          {
            firstName: NEW_FIRST_NAME
          },
          {
            headers: {
              'Authorization': `Bearer ${user.auth['access_token']}`
            }
          }
        )
        .then((result) => {
          response = result;
        });
    });

    it('should return status 200', () => {
      expect(response).to.have.status(200);
    });

    it('should change firstName', () => {
      expect(response).to.have.json('firstName', NEW_FIRST_NAME);
    });
  });

  describe('Remove Profile', () => {

    let response;

    before('send request', () => {

      return chakram
        .delete(`${config.baseUrl}/api/users/me`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${user.auth['access_token']}`
            }
          }
        )
        .then((result) => {
          response = result;
        });
    });

    it('should return status 204', () => {
      expect(response).to.have.status(204);
    });
  });

  after('remove user', () => {
    return specHelper.removeUser(user);
  });
});
