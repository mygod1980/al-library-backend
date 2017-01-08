'use strict';

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
    }
  }, {timestamps: true});

  return mongoose.model(modelName, schema);
};



