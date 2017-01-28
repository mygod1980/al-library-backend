'use strict';

const appTitle = 'al-library-backend';

module.exports = {
  port: process.env.PORT || 1340,
  mongo: process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost/al-library-backend',

  app: {
    title: appTitle
  },

  productName: 'PROmova',

  adminPanelUrl: process.env.ADMIN_PANEL_URL || 'http://localhost:3000',

  security: {
    tokenLife: 3600,
    jwtSignature: process.env.JWT_SIGNATURE || 'defaultSignature',
    accessCodeTtl: process.env.ACCESS_CODE_TTL || 60 * 60 * 24 * 7 // one week
  },

  redis: {
    keyPrefix: `${appTitle}.notifications`,
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
  },

  aws: {
    accessKeyId: process.env.AWS_KEY || 'AKIAJXC2Y2L36WCQXFFA',
    secretAccessKey: process.env.AWS_SECRET || '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',
    region: process.env.AWS_REGION || 'us-west-2'
  },

  email: {
    from: process.env.MAILER_FROM || 'orristurmurminintur@gmail.com',
    options: {
      service: process.env.MAILER_SERVICE_PROVIDER || 'ses',
      region: process.env.AWS_REGION || 'us-west-2'
    }
  },

  newRelic: {
    enabled: process.env.NEW_RELIC_ENABLED || false,
    licenseKey: process.env.NEW_RELIC_LICENSE_KEY || '',
    appName: process.env.NEW_RELIC_APP_NAME || appTitle,
    logLevel: process.env.NEW_RELIC_LOG_LEVEL || 'info'
  },

  agenda: {},

  logger: {
    suppressStdout: process.env.LOGGER_SUPPRESS_STDOUT,
    level: process.env.LOGGER_LEVEL || 'debug'
  },

  defaultClient: require('../default-client'),
  defaultUser: require('../default-user'),
  adminMail: process.env.ADMIN_MAIL || 'orristurmurminintur@gmail.com',
  roles: {
    USER: 'user',
    ADMIN: 'admin'
  },
  request: {
    types: {
      REGISTRATION: 'registration',
      DOWNLOAD_LINK: 'downloadLink'
    },
    statuses: {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected'
    }
  },
  s3: {
    key: process.env.AWS_KEY || 'AKIAJXC2Y2L36WCQXFFA',
    bucket: process.env.S3_BUCKET || 'al.donnu.publications',
    region: process.env.SES_REGION || 'us-west-2',
    secret: process.env.AWS_SECRET || '/C4b2bt5hMnlODLLGAh+tFU+Ijc0h2mWyPXS9K65',
    domain: process.env.S3_DOMAIN || '',
    emulation: process.env.S3_EMULATION || false,
    publishLifetime: process.env.S3_PUBLISH_LIFETIME || 3600
  },
};
