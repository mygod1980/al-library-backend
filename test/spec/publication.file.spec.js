/**
 * Created by eugenia on 08.01.17.
 */
'use strict';
const fs = require('fs');
const chakram = require('chakram');

const mongoose = require('config/mongoose');
const config = require('test/config');
const testConfig = require('test/config');
const specHelper = require('test/spec-helper');

const AccessCode = mongoose.model('AccessCode');
const Publication = mongoose.model('Publication');
const Request = mongoose.model('Request');
const expect = chakram.expect;

describe('Publication File', () => {

  const baseUrl = `${testConfig.baseUrl}/api/publications`;
  const adminUser = specHelper.getAdminUser();
  const user = specHelper.getFixture(specHelper.FIXTURE_TYPES.USER);
  const author = specHelper.getFixture(specHelper.FIXTURE_TYPES.AUTHOR);
  const publication = specHelper.getFixture(specHelper.FIXTURE_TYPES.PUBLICATION);
  const downloadLinkRequest = {
    type: Request.TYPES.DOWNLOAD_LINK,
    username: 'test@test.com'
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

  describe('Create publication by admin', () => {

    let response;

    before('create author', () => {
      return specHelper.createAuthor(author, adminUser.auth['access_token']);
    });

    before('send request', () => {
      publication.authors = [author._id];
      return chakram
        .post(baseUrl, publication, {headers: {'Authorization': `Bearer ${adminUser.auth['access_token']}`}})
        .then((result) => {
          response = result;
        });
    });

    it('should return status 201', () => {
      expect(response).to.have.status(201);
      Object.assign(publication, response.body);
      downloadLinkRequest.extra = {
        publicationId: publication._id
      };
    });
  });

  describe('Create publication by user', () => {

    let response;

    before('send request', () => {
      return chakram
        .post(baseUrl, publication, {headers: {'Authorization': `Bearer ${user.auth['access_token']}`}})
        .then((result) => {
          response = result;
        });
    });

    it('should return status 403', () => {
      expect(response).to.have.status(403);
    });
  });

  describe('Upload to GridFS by admin', () => {

    let response;

    before('send request', () => {
      return chakram
        .post(`${baseUrl}/${publication._id}/file`, undefined, {
          headers: {'Authorization': `Bearer ${adminUser.auth['access_token']}`},
          formData: {
            file: fs.createReadStream('test/data/files/publication.pdf'),
          },
        })
        .then((result) => {
          response = result;
        });
    });

    it('should return status 200', () => {
      expect(response).to.have.status(200);
      Object.assign(publication, response.body);
    });
  });

  describe('Upload to GridFS by user', () => {

    let response;

    before('send request', () => {
      return chakram
        .post(`${baseUrl}/${publication._id}/file`, undefined, {
          headers: {'Authorization': `Bearer ${user.auth['access_token']}`},
          formData:{
            file: fs.createReadStream('test/data/files/publication.pdf'),
          },
        })
        .then((result) => {
          response = result;
        });
    });

    it('should return status 403', () => {
      expect(response).to.have.status(403);
    });
  });

  describe('Get file from GridFS', () => {

    let response;
    before('send request', () => {
      return chakram
        .get(`${baseUrl}/${publication._id}/file`, {
          headers: {'Authorization': `Bearer ${user.auth['access_token']}`}
        })
        .then((result) => {
          response = result;
        });
    });

    it('should return status 200', () => {
      expect(response).to.have.status(200);
    });
  });

  describe('Get requested file with valid access code', () => {
    let response;
    let accessCode;

    before('create request', () => {
      return specHelper.createRequest(downloadLinkRequest);
    });

    before('approve request', () => {
      return specHelper.approveRequest(downloadLinkRequest._id, adminUser.auth['access_token']);
    });

    before('clear emails', () => {
      return specHelper.fetchAndClearSentEmails();
    });

    before('get access code', () => {
      return specHelper
        .getAccessCode(downloadLinkRequest.username, publication._id)
        .then((code) => {
          accessCode = code;
        });
    });

    before('get file', () => {
      const encodedUsername = encodeURIComponent(accessCode.requester);
      const encodedCode = encodeURIComponent(accessCode.code);

      return chakram
        .get(`${baseUrl}/${accessCode.publication.toString()}/file/download/${encodedUsername}/${encodedCode}`)
        .then((result) => {
          response = result;
        });
    });

    it('should return status 200', () => {
      expect(response).to.have.status(200);
    });

  });

  describe('Get requested file with invalid access code', () => {
    let response;

    before('get file', () => {
      return chakram
        .get(`${baseUrl}/${publication._id}/file/download/fakeusername/fakecode`)
        .then((result) => {
          response = result;
        });
    });

    it('should return status 400', () => {
      expect(response).to.have.status(400);
    });
  });

  describe('Remove file by user', () => {
    let response;
    before('send request', () => {
      return chakram
        .delete(`${baseUrl}/${publication._id}/file`, {}, {
          headers: {'Authorization': `Bearer ${user.auth['access_token']}`}
        })
        .then((result) => {
          response = result;
        });
    });

    it('should return status 403', () => {
      expect(response).to.have.status(403);
    });
  });

  describe('Remove file by admin', () => {
    let response;
    let downloadUrl;
    before('send request', () => {
      return chakram
        .delete(`${baseUrl}/${publication._id}/file`, {}, {
          headers: {'Authorization': `Bearer ${adminUser.auth['access_token']}`}
        })
        .then((result) => {
          response = result;
        });
    });

    it('should return status 200', () => {
      expect(response).to.have.status(200);
      downloadUrl = response.body.downloadUrl;
    });

    it('should have removed downloadUrl', () => {
      expect(downloadUrl).to.be.undefined;
    });
  });

  after('remove user', () => {
    return specHelper.removeUser(user);
  });

  after('remove author', () => {
    return specHelper.removeAuthor(author);
  });

  after('remove publication', () => {
    return specHelper.removePublication(publication);
  });

  after('remove request', () => {
    return specHelper.removeRequest(downloadLinkRequest);
  });

});