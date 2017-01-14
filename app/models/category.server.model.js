'use strict';
const modelName = 'Category';

module.exports = function (mongoose) {
  const schema = new mongoose.Schema({
    name: {
      type: String,
      unique: true,
      required: true
    },
    description: String
  }, {timestamps: true});

  return mongoose.model(modelName, schema);
};



