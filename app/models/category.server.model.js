'use strict';
const modelName = 'Category';

module.exports = function (mongoose) {
  const schema = new mongoose.Schema({
    name: {
      type: String,
      unique: true,
      trim: true,
      required: true
    },
    description: {
      type: String,
      trim: true
    }
  }, {timestamps: true});

  return mongoose.model(modelName, schema);
};



