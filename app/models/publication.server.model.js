'use strict';
const validate = require('mongoose-validator');
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
      trim: true,
      required: true
    },
    imageUrl: {
      type: String,
      validate: validate({
        validator: 'isURL'
      })
    },
    description: {
      type: String,
      trim: true,
      required: true
    },
    publishedAt: {
      type: Number
    },
    file: mongoose.Schema.Types.Mixed,

  }, {timestamps: true});

  return mongoose.model(modelName, schema);
};



