'use strict';

const modelName = 'Author';

module.exports = function (mongoose) {
  const schema = new mongoose.Schema({
    firstName: {
      type: String,
      trim: true,
      required: true
    },
    secondName: {
      trim: true,
      type: String
    },
    lastName: {
      trim: true,
      type: String,
      required: true
    },
    description: String

  }, {timestamps: true});

  return mongoose.model(modelName, schema);
};



