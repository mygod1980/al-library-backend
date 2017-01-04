/**
 * Created by eugenia 15.12.2016.
 */
module.exports = {
  name: process.env.CLIENT_NAME || 'AuthServices',
  clientId: process.env.CLIENT_KEY || 'default',
  clientSecret: process.env.CLIENT_SECRET || 'default'
};