'use strict';

const _ = require('lodash');
const chakram = require('chakram');

const mongoose = require('config/mongoose');
const config = require('test/config');
const specHelper = require('test/spec-helper');

const Category = mongoose.model('Category');
const expect = chakram.expect;

describe('Category', () => {

  const adminUser = specHelper.getAdminUser();
  const user = specHelper.getFixture(specHelper.FIXTURE_TYPES.USER);
  const category = specHelper.getFixture(specHelper.FIXTURE_TYPES.CATEGORY);

  before('sign in admin', () => {
    return specHelper.signInUser(adminUser);
  });
  
  before('create user by admin', () => {
    return specHelper.createUser(user, adminUser.auth['access_token']);
  });

  before('sign in user', () => {
    return specHelper.signInUser(user);
  });

  describe('Create category by admin', () => {

    let response;

    before('send post', () => {
      return chakram
        .post(`${config.baseUrl}/api/categories`, category, {
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
      category._id = response.body._id;
      return expect(response.body._id).to.exist;
    });
  });

  describe('Create category by plain user', () => {

    let response;

    before('send post', () => {
      return chakram
        .post(`${config.baseUrl}/api/categories`, category,
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
        .get(`${config.baseUrl}/api/categories`,
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
        .get(`${config.baseUrl}/api/categories`,
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
        .get(`${config.baseUrl}/api/categories/${category._id}`,
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
      expect(response).to.have.json('_id', category._id);
    });
    

    it('should be the same name', () => {
      expect(response).to.have.json('name', category.name);
    });
  });

  describe('Change category by user', () => {

    const NEW_NAME = 'new-name';

    let response;

    before('send request', () => {

      return chakram
        .patch(`${config.baseUrl}/api/categories/${category._id}`,
          {
            name: NEW_NAME
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

  describe('Remove category by user', () => {

    let response;

    before('send request', () => {

      return chakram
        .delete(`${config.baseUrl}/api/categories/${category._id}`,
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
  
  describe('Change category by admin', () => {

    const NEW_NAME = 'new-name';

    let response;

    before('send request', () => {

      return chakram
        .patch(`${config.baseUrl}/api/categories/${category._id}`,
          {
            name: NEW_NAME
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

    it('should change name', () => {
      expect(response).to.have.json('name', NEW_NAME);
    });
  });

  describe('Remove category by admin', () => {

    let response;

    before('send request', () => {

      return chakram
        .delete(`${config.baseUrl}/api/categories/${category._id}`,
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

  after('remove category', () => {
    return specHelper.removeCategory(category);
  });
});
