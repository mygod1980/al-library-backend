'use strict';

const modelName = 'Author';

module.exports = function (mongoose) {
  const schema = new mongoose.Schema({
    firstName: {
      type: String,
      required: true
    },
    secondName: {
      type: String
    },
    lastName: {
      type: String,
      unique: true,
      required: true
    },
    description: String

  }, {timestamps: true});

  return mongoose.model(modelName, schema);
};



