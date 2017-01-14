'use strict';

const _ = require('lodash');
const chakram = require('chakram');

const mongoose = require('config/mongoose');
const config = require('test/config');
const testConfig = require('test/config');
const specHelper = require('test/spec-helper');

const Request = mongoose.model('Request');
const expect = chakram.expect;

describe('Request', () => {

  const baseUrl = `${testConfig.baseUrl}/api/requests`;
  const adminUser = specHelper.getAdminUser();
  const user = specHelper.getFixture(specHelper.FIXTURE_TYPES.USER);
  const author = specHelper.getFixture(specHelper.FIXTURE_TYPES.AUTHOR);
  const publication = specHelper.getFixture(specHelper.FIXTURE_TYPES.PUBLICATION);
  const downloadLinkRequest = {
    type: Request.TYPES.DOWNLOAD_LINK,
    username: 'test@test.com'
  };
  const registrationRequest = {
    type: Request.TYPES.REGISTRATION,
    username: 'test0@test.com'
  };

  before('sign in admin', () => {
    return specHelper.signInUser(adminUser);
  });

  before('create new user', () => {
    return specHelper.createUser(user, adminUser.auth['access_token']);
  });

  before('sign in user', () => {
    return specHelper.signInUser(user);
  });

  describe('Create downloadLink request', () => {

    let response;
    let sentEmails;
    
    before('create author', () => {
      return specHelper.createAuthor(author, adminUser.auth['access_token']);
    });
    
    before('create publication', () => {
      return specHelper.createPublication(publication, adminUser.auth['access_token']);
    });

    before('send request', () => {
      return chakram
        .post(baseUrl, Object.assign({extra: {publicationId: publication._id}}, downloadLinkRequest, specHelper.getClientAuth()))
        .then((result) => {
          response = result;
        });
    });

    before('get emails', () => {
      return specHelper
        .fetchAndClearSentEmails()
        .then((result) => sentEmails = result);
    });

    it('should return status 201', () => {
      expect(response).to.have.status(201);
    });

    it('should have sent 1 email', () => {
      expect(sentEmails.length).to.be.equal(1);
    });

    it('should have sent username in email', () => {
      expect(sentEmails[0].html.indexOf(downloadLinkRequest.username)).to.be.above(-1);
      Object.assign(downloadLinkRequest, response.body);
    });
  });

  describe('Approve downloadLink request by user', () => {

    let response;
    let sentEmails;

    before('send request', () => {
      return chakram
        .post(`${baseUrl}/${downloadLinkRequest._id}/approve`, {},
          {headers: {'Authorization': `Bearer ${user.auth['access_token']}`}})
        .then((result) => {
          response = result;
        });
    });

    before('send request', () => {
      return specHelper
        .fetchAndClearSentEmails()
        .then((result) => sentEmails = result);
    });

    it('should return status 403', () => {
      expect(response).to.have.status(403);
    });
  });

  describe('Approve downloadLink request by admin', () => {

    let response;
    let sentEmails;

    before('send request', () => {
      return chakram
        .post(`${baseUrl}/${downloadLinkRequest._id}/approve`, {},
          {headers: {'Authorization': `Bearer ${adminUser.auth['access_token']}`}})
        .then((result) => {
          response = result;
        });
    });

    before('send request', () => {
      return specHelper
        .fetchAndClearSentEmails()
        .then((result) => sentEmails = result);
    });

    it('should return status 200', () => {
      expect(response).to.have.status(200);
    });

    it('should change status to "approved"', () => {
      expect(response.body.status).to.be.equal(Request.STATUSES.APPROVED);
      Object.assign(downloadLinkRequest, response.body);
    });

    it('should have sent 1 email', () => {
      expect(sentEmails.length).to.be.equal(1);
    });

    it(`should have sent email to ${downloadLinkRequest.username}`, () => {
      expect(sentEmails[0].to).to.be.equal(downloadLinkRequest.username);
    });
  });

  describe('Reject approved downloadLink request', () => {

    let response;
    let sentEmails;

    before('send request', () => {
      return chakram
        .post(`${baseUrl}/${downloadLinkRequest._id}/reject`, {},
          {headers: {'Authorization': `Bearer ${adminUser.auth['access_token']}`}})
        .then((result) => {
          response = result;
        });
    });

    before('send request', () => {
      return specHelper
        .fetchAndClearSentEmails()
        .then((result) => sentEmails = result);
    });

    it('should return status 403', () => {
      expect(response).to.have.status(403);
    });
  });

  describe('Create registration request', () => {

    let response;
    let sentEmails;
    const extra = {
      firstName: 'test0',
      lastName: 'test0'
    };

    before('send request', () => {
      return chakram
        .post(`${baseUrl}`, Object.assign({extra}, registrationRequest, specHelper.getClientAuth()))
        .then((result) => {
          response = result;
        });
    });

    before('get emails', () => {
      return specHelper
        .fetchAndClearSentEmails()
        .then((result) => sentEmails = result);
    });

    it('should return status 201', () => {
      expect(response).to.have.status(201);
      Object.assign(registrationRequest, response.body);
    });

    it('should have sent 1 email', () => {
      expect(sentEmails.length).to.be.equal(1);
    });

    it('should have sent username in email', () => {
      expect(sentEmails[0].html.indexOf(registrationRequest.username)).to.be.above(-1);
    });

    it('should have sent firstName in email', () => {
      expect(sentEmails[0].html.indexOf(registrationRequest.extra.firstName)).to.be.above(-1);
    });

    it('should have sent lastName in email', () => {
      expect(sentEmails[0].html.indexOf(registrationRequest.extra.lastName)).to.be.above(-1);
    });

  });

  describe('Reject registration request', () => {

    let response;
    let sentEmails;

    before('send request', () => {
      return chakram
        .post(`${baseUrl}/${registrationRequest._id}/reject`, {},
          {headers: {'Authorization': `Bearer ${adminUser.auth['access_token']}`}})
        .then((result) => {
          response = result;
        });
    });

    before('send request', () => {
      return specHelper
        .fetchAndClearSentEmails()
        .then((result) => sentEmails = result);
    });

    it('should return status 200', () => {
      expect(response).to.have.status(200);
    });

    it('should change status to "rejected"', () => {
      expect(response.body.status).to.be.equal(Request.STATUSES.REJECTED);
      Object.assign(registrationRequest, response.body);
    });

    it('should have sent 1 email', () => {
      expect(sentEmails.length).to.be.equal(1);
    });

    it(`should have sent email to ${registrationRequest.username}`, () => {
      expect(sentEmails[0].to).to.be.equal(registrationRequest.username);
    });
  });

  describe('Get List by admin', () => {

    let response;

    before('send request', () => {
      return chakram
        .get(`${config.baseUrl}/api/requests`,
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
        .get(`${config.baseUrl}/api/requests`,
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

  describe('Get one by admin', () => {

    let response;

    before('send request', () => {
      return chakram
        .get(`${baseUrl}/${downloadLinkRequest._id}`,
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

    it('should be the same _id', () => {
      expect(response).to.have.json('_id', downloadLinkRequest._id);
    });
  });

  describe('Change by admin', () => {

    const NEW_FIRST_NAME = 'new-first-name';

    let response;

    before('send request', () => {

      return chakram
        .patch(`${config.baseUrl}/api/requests/${downloadLinkRequest._id}`,
          {
            firstName: NEW_FIRST_NAME
          },
          {
            headers: {
              'Authorization': `Bearer ${adminUser.auth['access_token']}`
            }
          }
        )
        .then((result) => {
          response = result;
        });
    });

    it('should return status 404', () => {
      expect(response).to.have.status(404);
    });
  });

  describe('Change by user', () => {

    const NEW_FIRST_NAME = 'new-first-name';

    let response;

    before('send request', () => {

      return chakram
        .patch(`${config.baseUrl}/api/requests/${downloadLinkRequest._id}`,
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

    it('should return status 404', () => {
      expect(response).to.have.status(404);
    });
  });

  describe('Remove by user', () => {

    let response;

    before('send request', () => {

      return chakram
        .delete(`${config.baseUrl}/api/requests/${downloadLinkRequest._id}`,
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

    it('should return status 403', () => {
      expect(response).to.have.status(403);
    });
  });

  describe('Remove by admin', () => {

    let response;

    before('send request', () => {

      return chakram
        .delete(`${baseUrl}/${downloadLinkRequest._id}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${adminUser.auth['access_token']}`
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

  after('remove downloadLink request', () => {
    return specHelper.removeRequest(downloadLinkRequest);
  });

  after('remove registration request', () => {
    return specHelper.removeRequest(registrationRequest);
  });

  after('remove author', () => {
    return specHelper.removeAuthor(author);
  });

  after('remove author', () => {
    return specHelper.removeAuthor(author);
  });

  after('remove publication', () => {
    return specHelper.removePublication(publication);
  });
});