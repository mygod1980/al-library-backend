'use strict';
const config = require('config/config');
const modelName = 'AccessCode';

module.exports = function (mongoose) {
  const schema = new mongoose.Schema({
    requester: {
      type: String,
      required: true
    },
    publication: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    code: {
      type: String,
      unique: true,
      required: true
    },
    createdAt: {
      type: Date,
      'default': Date.now,
      expires: config.security.accessCodeTtl
    }
  });

  return mongoose.model(modelName, schema);
};



