/**
 * Created by eugenia on 08/07/16.
 */
const config = require('config/config');

module.exports = {
  baseUrl: process.env.BASE_URL || 'http://localhost:1341',
  client: config.defaultClient,
  user: config.defaultUser
};