/**
 * Created by eugenia on 08.01.17.
 */
const Bb = require('bluebird');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const s3Config = require('config/config').s3;
const awsConfig = new AWS.Config({
  accessKeyId: s3Config.key, region: s3Config.region
});

class S3Service {
  static upload({data, key}) {
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