'use strict';

const modelName = 'Publication';

module.exports = function (mongoose) {
  const schema = new mongoose.Schema({
    author: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: true
    }],
    tags: [{
      type: String,
      'enum': [/*TODO: add tags here like categories keys*/]
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
    },
    // upload to s3 or some other storage
    downloadLink: {
      type: String
    }
  }, {timestamps: true});

  return mongoose.model(modelName, schema);
};



