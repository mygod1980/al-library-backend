'use strict';

const appTitle = 'al-library-backend-backend';

module.exports = {
  port: process.env.PORT || 1340,
  mongo: process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost/al-library-backend',
  
  app: {
    title: appTitle
  },
  
  security: {
    tokenLife: 3600,
    jwtSignature: process.env.JWT_SIGNATURE || 'defaultSignature'
  },

  redis: {
    keyPrefix: `${appTitle}.notifications`,
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
  },

  aws: {
    accessKeyId: 'xxx',
    secretAccessKey: 'xxx'
  },

  email: {
    from: process.env.MAILER_FROM || 'no-reply@your-domain.com',
    options: {
      service: process.env.MAILER_SERVICE_PROVIDER || 'ses'
    }
  },

  newRelic: {
    enabled: process.env.NEW_RELIC_ENABLED || false,
    licenseKey: process.env.NEW_RELIC_LICENSE_KEY || '',
    appName: process.env.NEW_RELIC_APP_NAME || appTitle,
    logLevel: process.env.NEW_RELIC_LOG_LEVEL || 'info'
  },
  
  urls: {
    resetPassword: 'https://your-domain.com/#/reset_password/' || process.env.URL_RESET_PASSWORD
  },

  agenda: {},

  logger: {
    suppressStdout: process.env.LOGGER_SUPPRESS_STDOUT,
    level: process.env.LOGGER_LEVEL || 'debug'
  },

  defaultClient: require('../default-client'),
  defaultUser: require('../default-user'),
  roles: {
    USER: 'user',
    STUDENT: 'student',
    ADMIN: 'admin'
  }
};
