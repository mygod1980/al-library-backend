'use strict';

module.exports = {
	port: process.env.PORT || 1341,
	mongo: process.env.MONGO_URL || 'mongodb://localhost/al-library-backend-test',
	defaultClient: {
    name: process.env.CLIENT_NAME || 'testDefault',
    clientId: process.env.CLIENT_KEY || 'testDefault',
    clientSecret: process.env.CLIENT_SECRET || 'testDefault'
	},
  coverageEnabled: false,
  adminMail: 'admin@test.com'
};
