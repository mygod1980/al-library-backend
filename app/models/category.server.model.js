'use strict';
const modelName = 'Category';

module.exports = function (mongoose) {
  const schema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    }
  }, {timestamps: true});

  return mongoose.model(modelName, schema);
};



