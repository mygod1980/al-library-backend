'use strict';
const _ = require('lodash');
const config = require('config/config');
const modelName = 'Publication';

module.exports = function (mongoose) {
  const schema = new mongoose.Schema({
    authors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: true
    }],
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],
    title: {
      type: String,
      unique: true,
      required: true
    },
    imageUrl: {
      type: String
      // add isUrl validation
      // TODO: link to s3 or any other storage
    },
    description: {
      type: String,
      required: true
    },
    publishedAt: {
      type: Number
    }
  }, {timestamps: true});

  return mongoose.model(modelName, schema);
};



