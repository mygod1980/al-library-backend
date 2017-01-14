'use strict';

const config = require('config/config');
const log = require('config/log')(module);

module.exports = (app) => {

  const http = require('http').createServer(app);
  const sio = app.sio = require('socket.io')(http);
  const redis = require('socket.io-redis');

  sio.adapter(redis(config.redis.url));

  const authDelegate = app.authDelegate;

  sio.use((socket, next) => {
    let clientData;
    let token;
    const auth = socket.request.headers.authorization || socket.request._query['authorization'];
    if (auth) {
      const parts = auth.split(' ');
      let value = parts[1];
      if (value) {
        if ('basic' === parts[0].toLowerCase()) {
          // credentials
          value = Buffer.from(value).toString('base64');
          value = value.match(/^([^:]*):(.*)$/);
          if (value) {
            clientData = {
              clientId: value[1],
              clientSecret: value[2]
            };
          }

        } else if ('bearer' === parts[0].toLowerCase()) {
          token = value;
        }
      }
    }

    if (token) {
      return authDelegate
        .findUserByToken({accessToken: token})
        .then((result) => {
          if (!result || !result.obj) {
            throw new Error('Wrong credentials');
          }

          socket.handshake.user = result.obj;

        })
        .asCallback(next);
    } else if (clientData) {
      return authDelegate
        .findClient(clientData)
        .then((result) => {
          if (!result) {
            throw new Error('Wrong client data');
          }

          socket.handshake.client = result;

        })
        .asCallback(next);
    } else {
      const err = new Error('No auth data available');
      log.error(err);
      return next(err);
    }
  });

  sio.use((socket, next) => {
    try {
      const {user} = socket.handshake;
      if (user) {
        socket.join(`user#${user._id}`);
      }
      return next();
    } catch(err) {
      return next(err);
    }
  });


    sio.on('connection', (socket) => {
    console.log('connected');

    socket.on('error', (err) => {
      log.error('Error happened');
      log.error(err);
    });
  });
  app.http = http;
};
