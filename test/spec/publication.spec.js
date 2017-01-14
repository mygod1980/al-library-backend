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
const expect = chakram.expect;

describe('Publication', () => {

  const baseUrl = `${testConfig.baseUrl}/api/publications`;
  const adminUser = specHelper.getAdminUser();
  const user = specHelper.getFixture(specHelper.FIXTURE_TYPES.USER);
  const author = specHelper.getFixture(specHelper.FIXTURE_TYPES.AUTHOR);
  const publication = specHelper.getFixture(specHelper.FIXTURE_TYPES.PUBLICATION);

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

  describe('Get List by user', () => {

    let response;

    before('send request', () => {
      return chakram
        .get(`${baseUrl}`,
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

    it('should return an array', () => {
      expect(response.body).to.be.instanceOf(Array);
    });

    it('should return 1 publication', () => {
      expect(response.body.length).to.be.equal(1);
    });

  });

  describe('Get List by unauthenticated user', () => {

    let response;

    before('send request', () => {
      return chakram
        .get(baseUrl)
        .then((result) => {
          response = result;
        });
    });

    it('should return status 200', () => {
      expect(response).to.have.status(200);
    });

    it('should return an array', () => {
      expect(response.body).to.be.instanceOf(Array);
    });

    it('should return 1 publication', () => {
      expect(response.body.length).to.be.equal(1);
    });

  });

  describe('Get one by admin', () => {

    let response;

    before('send request', () => {
      return chakram
        .get(`${baseUrl}/${publication._id}`,
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
      expect(response).to.have.json('_id', publication._id);
    });
  });

  describe('Change by admin', () => {

    const NEW_TITLE = 'new-title';

    let response;

    before('send request', () => {

      return chakram
        .patch(`${baseUrl}/${publication._id}`,
          {
            title: NEW_TITLE
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

    it('should return status 200', () => {
      expect(response).to.have.status(200);
      Object.assign(publication, response.body);
    });

    it('should have changed the title', () => {
      expect(publication.title).to.be.equal(NEW_TITLE);
    });
  });

  describe('Change by user', () => {

    const NEW_TITLE = 'new-title';

    let response;

    before('send request', () => {

      return chakram
        .patch(`${baseUrl}/${publication._id}`,
          {
            title: NEW_TITLE
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

    it('should return status 403', () => {
      expect(response).to.have.status(403);
    });
  });

  describe('Remove by user', () => {

    let response;

    before('send request', () => {

      return chakram
        .delete(`${baseUrl}/${publication._id}`,
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
        .delete(`${baseUrl}/${publication._id}`,
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

  after('remove author', () => {
    return specHelper.removeAuthor(author);
  });

  after('remove publication', () => {
    return specHelper.removePublication(publication);
  });
});