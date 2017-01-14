'use strict';

const chakram = require('chakram');

const mongoose = require('config/mongoose');
const config = require('config/config');
const testConfig = require('test/config');
const specHelper = require('test/spec-helper');

const User = mongoose.model('User');
const expect = chakram.expect;

describe('User Auth', () => {
  const adminUser = specHelper.getAdminUser();
  const user = specHelper.getFixture(specHelper.FIXTURE_TYPES.USER);
  const otherUser = specHelper.getFixture(specHelper.FIXTURE_TYPES.USER);

  before('sign in admin', () => {
    return specHelper.signInUser(adminUser);
  });

  before('create and sign in user', () => {
    return specHelper
      .createUser(user, adminUser.auth['access_token'])
      .then(specHelper.signInUser.bind(specHelper, user));
  });

  before('create and sign in otherUser', () => {
    return specHelper
      .createUser(otherUser, adminUser.auth['access_token'])
      .then(specHelper.signInUser.bind(specHelper, otherUser));
  });

  describe('Logout', () => {

    let response;

    before('send request', () => {

      return chakram
        .post(`${testConfig.baseUrl}/api/users/logout`,
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
      return expect(response).to.have.status(204);
    });

    it('should not be possible to use old token', () => {
      return chakram
        .get(`${testConfig.baseUrl}/api/users/me`,
          {
            headers: {
              'Authorization': `Bearer ${user.auth['access_token']}`
            }
          })
        .then((result) => {
          return expect(result).to.have.status(401);
        });
    });

    after('sign in user', () => {
      return specHelper.signInUser(user);
    });
  });

  describe('Change password', () => {

    let response;

    before('send request', () => {

      const newPassword = 'newPassword';

      return chakram
        .post(
          `${testConfig.baseUrl}/api/users/me/change-password`,
          {
            password: user.password,
            newPassword: newPassword
          },
          {
            headers: {
              'Authorization': `Bearer ${user.auth['access_token']}`
            }
          }
        )
        .then((result) => {
          response = result;
          user.password = newPassword;
        });
    });

    before('sign in with new password', () => {
      // we are not checking result as it just will crash in this place, if it's not able to sign in
      return specHelper.signInUser(user);
    });

    it('should return status 204', () => {
      return expect(response).to.have.status(204);
    });

  });

  describe('Change password by other user', () => {

    let response;

    before('send request', () => {

      const newPassword = 'anotherNewPassword';

      return chakram
        .post(
          `${testConfig.baseUrl}/api/users/${user._id}/change-password`,
          {
            password: user.password,
            newPassword: newPassword
          },
          {
            headers: {
              'Authorization': `Bearer ${otherUser.auth['access_token']}`
            }
          }
        )
        .then((result) => {
          response = result;
        });
    });

    it('should return status 400', () => {
      return expect(response).to.have.status(400);
    });

  });

  describe('Forgot password for not existing user', () => {

    let response;

    before('send request', () => {

      return chakram
        .post(
          `${testConfig.baseUrl}/api/users/forgot`,
          Object.assign(specHelper.getClientAuth(), {username: 'someFakeUserName'})
        )
        .then((result) => {
          response = result;
        });
    });

    it('should return status 400', () => {
      return expect(response).to.have.status(400);
    });

  });

  describe('Forgot password', () => {

    let response;
    let userDoc;
    let sentEmails;

    before('send request', () => {

      return chakram
        .post(
          `${testConfig.baseUrl}/api/users/forgot`,
          Object.assign(specHelper.getClientAuth(), {username: user.username})
        )
        .then((result) => {
          response = result;
        });
    });

    before('wait event processing', (done) => {
      setTimeout(done, 500);
    });

    before('fetch user from db', () => {
      return User
        .findOne({_id: user._id}).select('resetPassword').lean().exec()
        .then((result) => {userDoc = result});
    });

    before('send request', () => {
      return specHelper
        .fetchAndClearSentEmails()
        .then((result) => sentEmails = result);
    });

    it('should return status 204', () => {
      return expect(response).to.have.status(204);
    });

    it('should set reset token for user in db', () => {
      return expect(userDoc.resetPassword.token).to.exist;
    });

    it('should contain 1 email', () => {
      return expect(sentEmails.length).to.be.equal(1);
    });

    it('email should be sent to this user', () => {
      return expect(sentEmails[0].to).to.be.equal(user.username.toLowerCase());
    });

    it('email should contain reset token of this user', () => {
      user.resetPassword = userDoc.resetPassword;
      return expect(sentEmails[0].html.indexOf(user.resetPassword.token)).to.be.above(-1);
    });

  });

  describe('Reset password', () => {

    let response;
    let sentEmails;

    before('send request', () => {

      user.password = 'completelyOtherPassword';

      return chakram
        .post(
          `${testConfig.baseUrl}/api/users/reset/${user.resetPassword.token}`,
          Object.assign(specHelper.getClientAuth(), {newPassword: user.password})
        )
        .then((result) => {
          response = result;
        });
    });

    before('wait event processing', (done) => {
      setTimeout(done, 500);
    });

    before('send request', () => {
      return specHelper
        .fetchAndClearSentEmails()
        .then((result) => sentEmails = result);
    });

    it('should return status 204', () => {
      return expect(response).to.have.status(204);
    });

    before('sign in with new password', () => {
      // we are not checking result as it just will crash in this place, if it's not able to sign in
      return specHelper.signInUser(user);
    });

    it('should contain 1 email', () => {
      return expect(sentEmails.length).to.be.equal(1);
    });

  });

  describe('Reset password using the same token', () => {

    let response;

    before('send request', () => {

      user.password = 'completelyOtherPassword';

      return chakram
        .post(
          `${testConfig.baseUrl}/api/users/reset/${user.resetPassword.token}`,
          Object.assign(specHelper.getClientAuth(), {newPassword: user.password})
        )
        .then((result) => {
          response = result;
        });
    });

    it('should return status 400', () => {
      return expect(response).to.have.status(400);
    });

  });

  describe('Reset password using random token', () => {

    let response;

    before('send request', () => {

      user.password = 'completelyOtherPassword';

      return chakram
        .post(
          `${testConfig.baseUrl}/api/users/reset/someRandomValue`,
          Object.assign(specHelper.getClientAuth(), {newPassword: user.password})
        )
        .then((result) => {
          response = result;
        });
    });

    it('should return status 400', () => {
      return expect(response).to.have.status(400);
    });

  });

  after('remove user', () => {
    return specHelper.removeUser(user);
  });

  after('remove otherUser', () => {
    return specHelper.removeUser(otherUser);
  });

});
