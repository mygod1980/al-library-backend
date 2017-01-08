/**
 * Created by eugenia on 08.01.17.
 */
const fs = require('fs');
const Bb = require('bluebird');
const AWS = require('aws-sdk');
const s3Config = require('config/config').s3;

AWS.config.update({
  accessKeyId: s3Config.key,
  secretAccessKey: s3Config.secret,
  region: s3Config.region
});
const s3 = new AWS.S3();

class S3Service {
  static upload({data, key}) {

    if (!Buffer.isBuffer(data)) {
      /* we're dealing with file */
      data = fs.createReadStream(data.path);
    }

    const params = {
      Bucket: s3Config.bucket,
      ACL: 'private',
      /* publication._id */
      Key: key,
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
        return response;
      });

  }
}

module.exports = S3Service;