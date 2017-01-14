'use strict';

const _ = require('lodash');
const chakram = require('chakram');

const mongoose = require('config/mongoose');
const config = require('test/config');
const specHelper = require('test/spec-helper');

const Author = mongoose.model('Author');
const expect = chakram.expect;

describe('Author', () => {

  const adminUser = specHelper.getAdminUser();
  const user = specHelper.getFixture(specHelper.FIXTURE_TYPES.USER);
  const author = specHelper.getFixture(specHelper.FIXTURE_TYPES.AUTHOR);

  before('sign in admin', () => {
    return specHelper.signInUser(adminUser);
  });
  
  before('create user by admin', () => {
    return specHelper.createUser(user, adminUser.auth['access_token']);
  });

  before('sign in user', () => {
    return specHelper.signInUser(user);
  });

  describe('Create author by admin', () => {

    let response;

    before('send post', () => {
      return chakram
        .post(`${config.baseUrl}/api/authors`, author, {
          headers: {
            'Authorization': `Bearer ${adminUser.auth['access_token']}`
          }
        })
        .then((result) => {
          response = result;
        });
    });

    it('should return status 201', () => {
      return expect(response).to.have.status(201);
    });

    it('should contain _id', () => {
      author._id = response.body._id;
      return expect(response.body._id).to.exist;
    });
  });

  describe('Create author by plain user', () => {

    let response;

    before('send post', () => {
      return chakram
        .post(`${config.baseUrl}/api/authors`, author,
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
      return expect(response).to.have.status(403);
    });
  });

  describe('Get List by admin', () => {

    let response;

    before('send request', () => {
      return chakram
        .get(`${config.baseUrl}/api/authors`,
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
        .get(`${config.baseUrl}/api/authors`,
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

  });

  describe('Get one', () => {

    let response;

    before('send request', () => {
      return chakram
        .get(`${config.baseUrl}/api/authors/${author._id}`,
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
      expect(response).to.have.json('_id', author._id);
    });


    it('should be the same firstName', () => {
      expect(response).to.have.json('firstName', author.firstName);
    });

    it('should be the same secondName', () => {
      expect(response).to.have.json('secondName', author.secondName);
    });

    it('should be the same lastName', () => {
      expect(response).to.have.json('lastName', author.lastName);
    });

    it('should be the same description', () => {
      expect(response).to.have.json('description', author.description);
    });
  });

  describe('Change author by user', () => {

    const NEW_FIRST_NAME = 'new-first-name';

    let response;

    before('send request', () => {

      return chakram
        .patch(`${config.baseUrl}/api/authors/${author._id}`,
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

    it('should return status 403', () => {
      expect(response).to.have.status(403);
    });
  });

  describe('Remove author by user', () => {

    let response;

    before('send request', () => {

      return chakram
        .delete(`${config.baseUrl}/api/authors/${author._id}`,
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

  describe('Change author by admin', () => {

    const NEW_FIRST_NAME = 'new-first-name';

    let response;

    before('send request', () => {

      return chakram
        .patch(`${config.baseUrl}/api/authors/${author._id}`,
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

    it('should return status 200', () => {
      expect(response).to.have.status(200);
    });

    it('should change firstName', () => {
      expect(response).to.have.json('firstName', NEW_FIRST_NAME);
    });
  });

  describe('Remove author by admin', () => {

    let response;

    before('send request', () => {

      return chakram
        .delete(`${config.baseUrl}/api/authors/${author._id}`,
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
});
