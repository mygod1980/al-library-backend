/**
 * Created by eugenia on 08.01.17.
 */
const fs = require('fs');
const Bb = require('bluebird');
const AWS = require('aws-sdk');
const s3Config = require('config/config').s3;

const s3 = new AWS.S3({accessKeyId: s3Config.key,
  secretAccessKey: s3Config.secret,
  region: s3Config.region});

class S3Service {
  static upload({data, key, extension}) {

    if (!Buffer.isBuffer(data)) {
      /* we're dealing with file */
      data = fs.createReadStream(data.path);
    }

    const params = {
      Bucket: s3Config.bucket,
      ACL: 'private',
      /* publication._id */
      Key: extension ? `${key}.${extension}` : key,
      /* Buffer or Readable Stream*/
      Body: data
    };

    return Bb
      .fromCallback((callback) => {
        return s3.upload(params, {}, callback);
      })
      .then((response) => {
        return response;
      });
  }

  static download(key) {
    const params = {
      Bucket: s3Config.bucket,
      Key: key
    };

    return Bb
      .fromCallback((callback) => {
        return s3.getObject(params, callback);
      })
      .then((response) => {
        return {file: response.Body, contentType: response.ContentType};
      });

  }

  static removeObject(key) {
    const params = {
      Bucket: s3Config.bucket,
      Key: key
    };
    return Bb
      .fromCallback((callback) => {
        return s3.deleteObject(params, callback);
      });
  }
}

module.exports = S3Service;