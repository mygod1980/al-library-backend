/**
 * Created by eugenia on 08/07/16.
 */
'use strict';

module.exports = function () {
  require('config/init')();
  const config = require('config/config');
  const log = require('config/log')(module);

  // require mongoose (connect to DB)
  require('config/mongoose');

  const Mocha = require('mocha');

  // Instantiate a Mocha instance.
  const mocha = new Mocha({
    ui: 'bdd',
    fullTrace: true,
    timeout: 50000
  });

  const testDir = 'test/spec';

  config.getGlobbedFiles(`${testDir}/**/**.js`, './').forEach((filePath) => {
    mocha.addFile(filePath);
  });

  // Run the tests.
  mocha.run((failures) => {
    process.exit(failures);  // exit with non-zero status if there were failures
  });
};
