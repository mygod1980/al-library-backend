/**
 * Created by eugenia on 06.01.17.
 */
'use strict';
const _ = require('lodash');
const config = require('config/config');
const {types, statuses} = config.request;
const modelName = 'Request';

module.exports = function (mongoose) {
  const schema = new mongoose.Schema({
    type: {
      type: String,
      'enum': _.values(types),
      required: true
    },
    status: {
      type: String,
      'enum': _.values(statuses),
      'default': statuses.PENDING,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    extra: {
      /* if type is registration `extra` contains firstName, lastName, role
       * else
       * Publication id
       * */
      type: mongoose.Schema.Types.Mixed,
      required: true
    }

  }, {timestamps: true});

  schema.statics.STATUSES = statuses;
  schema.statics.TYPES = types;

  return mongoose.model(modelName, schema);
};



