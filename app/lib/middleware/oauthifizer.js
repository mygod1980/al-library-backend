/**
 * Created by eugenia on 10/10/15.
 */

'use strict';

const OAuthifizer = require('oauthifizer');

module.exports = function (app) {
  const AuthDelegate = require('app/lib/auth-delegate');
  const authDelegate = new AuthDelegate();
  const oAuthifizer = new OAuthifizer(authDelegate);
  app.route('/oauth').post(oAuthifizer.getToken());
  app.oAuthifizer = oAuthifizer;
};
