'use strict';
const _ = require('lodash');
const config = require('config/config');
const authPlugin = require('app/lib/restifizer.plugin/auth.restifizer.plugin');
const modelName = 'User';

module.exports = function (mongoose) {
  const schema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    role: {
      type: String,
      'enum': _.values(config.roles),
      required: true
    }
  }, {
    timestamps: true
  });

  /**
   *  {
   *    username: {
   *      type: String,
   *      unique: 'User with this username already exists',
   *      sparse: true,
   *      required: [
   *        requiredForLocalProvider,
   *        'Path `{PATH}` is required.'
   *      ],
   *      trim: true,
   *      lowercase: true
   *    },
   *    hashedPassword: {
   *      type: String,
   *      default: '',
   *      required: [
   *        requiredForLocalProvider,
   *        'Path `{PATH}` is required.'
   *      ]
   *    },
   *    salt: {
   *      type: String
   *    },
   *    provider: {
   *      type: String,
   *      'default': LOCAL_PROVIDER,
   *      required: true
   *    },
   *    linkedAccounts: {}
   *  },
   *  resetPassword: {
   *    token: String,
   *    expires: Date
   *  },
   *
   *  schema.statics.logout(userId)
   *  schema.methods.hashPassword(password)
   *  schema.methods.authenticate(password)
   *  schema.virtual('password')
   */
  schema.plugin(authPlugin.mongoose, {mongoose: mongoose});

  schema.statics.ROLES = config.roles;
  schema.methods.isAdmin = function () {
    return this.role === config.roles.ADMIN;
  };
  return mongoose.model(modelName, schema);
};
