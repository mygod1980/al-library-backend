'use strict';

/**
 * Module dependencies.
 */
const _ = require('lodash');
const glob = require('glob');

/**
 * Load app configurations
 */
const files = ['config.local.json', 'config.local.js'];
if (process.env.NODE_ENV) {
  files.push('config/env/' + process.env.NODE_ENV);
}
files.push('config/env/all');

const config = _.defaultsDeep(...files.map(file => {
  try {
    return require(file);
  }
  catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      console.error(e.code);
      throw e;
    }

    return {};
  }
}));

/**
 * Get files by glob patterns
 */
const getGlobbedFiles = function (globPatterns, removeRoot) {
  // For context switching
  const _this = this;

  // URL paths regex
  const urlRegex = new RegExp('^(?:[a-z]+:)?\/\/', 'i');

  // The output array
  let output = [];

  // If glob pattern is array so we use each pattern in a recursive way, otherwise we use glob
  if (_.isArray(globPatterns)) {
    globPatterns.forEach(function (globPattern) {
      output = _.union(output, _this.getGlobbedFiles(globPattern, removeRoot));
    });
  } else if (_.isString(globPatterns)) {
    if (urlRegex.test(globPatterns)) {
      output.push(globPatterns);
    } else {
      glob(globPatterns, {
        sync: true
      }, function (err, files) {
        if (removeRoot) {
          files = files.map(function (file) {
            return file.replace(removeRoot, '');
          });
        }

        output = _.union(output, files);
      });
    }
  }

  return output;
};

module.exports = Object.assign(config, {getGlobbedFiles});
module.exports.isTest = process.env.NODE_ENV === 'test';
module.exports.isProduction = process.env.NODE_ENV === 'production';
