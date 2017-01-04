'use strict';

const _ = require('lodash');
const chakram = require('chakram');

const mongoose = require('config/mongoose');
const config = require('config/config');
const specHelper = require('test/spec-helper');

const expect = chakram.expect;

describe('User Socket', () => {

  const user = specHelper.getFixture(specHelper.FIXTURE_TYPES.USER);
  const otherUser = specHelper.getFixture(specHelper.FIXTURE_TYPES.USER);

  let userSocket;

  before('send post', (done) => {
    userSocket = specHelper.connectToSocket({
      extraHeaders: {
        'Authorization': `Basic ${specHelper.getBasicAuth()}`
      }
    });
    userSocket.on('connect', () => {
      done();
    });
  });

  describe('Sign up', () => {

    let response;

    before('send request', (done) => {
      userSocket.once('restifizer', (data) => {
        response = data.result;
        done();
      });
      userSocket.emit('restifizer', {route: 'post:/api/users', body: user});
    });

    it('should return status 201', () => {
      return expect(response.statusCode).to.be.equal(201);
    });

    it('should contain _id', () => {
      user._id = response.body._id;
      return expect(response.body._id).to.exist;
    });

    after('send post', () => {
      return specHelper.signInUser(user);
    });

  });

  describe('Get user list', () => {
    let response;

    before('create and sign in otherUser', () => {
      return specHelper
        .createUser(otherUser)
        .then(() => {
          return specHelper.signInUser(otherUser);
        })
    });

    before('send request', (done) => {
      userSocket.once('restifizer', (data) => {
        response = data.result;
        done();
      });
      userSocket.emit('restifizer', {route: 'get:/api/users'});
    });

    it('should return status 403', () => {
      return expect(response.statusCode).to.be.equal(403);
    });
  });

  describe('Get Profile', () => {

    let response;

    before('send request', (done) => {
      userSocket.once('restifizer', (data) => {
        response = data.result;
        done();
      });
      userSocket.emit('restifizer', {route: 'get:/api/users/:_id', params: {_id: 'me'}});
    });

    it('should return status 200', () => {
      return expect(response.statusCode).to.be.equal(200);
    });

    it('should be the same _id', () => {
      return expect(response.body._id).to.be.equal(user._id);
    });

    it('should be the same username', () => {
      return expect(response.body.username).to.be.equal(user.username.toLowerCase());
    });

    it('should be the same firstName', () => {
      return expect(response.body.firstName).to.be.equal(user.firstName);
    });

  });

  describe('Change Profile', () => {

    const NEW_VALUE = 'new-firstName';

    let response;

    before('send request', (done) => {
      userSocket.once('restifizer', (data) => {
        response = data.result;
        done();
      });
      userSocket.emit('restifizer', {
        route: 'patch:/api/users/:_id',
        params: {_id: 'me'},
        body: {firstName: NEW_VALUE}
      });
    });

    it('should return status 200', () => {
      return expect(response.statusCode).to.be.equal(200);
    });

    it('should change firstName', () => {
      return expect(response.body.firstName).to.be.equal(NEW_VALUE);
    });
  });

  describe('Remove Profile', () => {

    let response;

    before('send request', (done) => {
      userSocket.once('restifizer', (data) => {
        response = data.result;
        done();
      });
      userSocket.emit('restifizer', {route: 'delete:/api/users/:_id', params: {_id: 'me'}});
    });

    it('should return status 204', () => {
      return expect(response.statusCode).to.be.equal(204);
    });
  });

  after('remove user', () => {
    return specHelper.removeUser(user);
  });

  after('remove otherUser', () => {
    return specHelper.removeUser(otherUser);
  });

});
