'use strict';

module.exports = () => {
  const init = require('config/init')();
  const mongoose = require('config/mongoose');
  const Migration = mongoose.model('Migration');
  const config = require('config/config');
  const log = require('config/log')(module);
  const migrate = require('migrate');

  const key = 'main';

  log.info('Running migration...');

  const migration = migrate.load('migrations/.migrate', 'migrations');
  
  migration.save = function (callback) {

    return Migration
      .findOneAndUpdate({
        key: key
      }, {
        migrations: this.migrations,
        pos: this.pos
      }, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      })
      .then(() => {
        this.emit('save');
      })
      .asCallback(callback);
  };

  migration.load = function (callback) {
    this.emit('load');
    
    Migration.findOne({key: key}).lean().exec()
      .then((migrationData) => {
        if (!migrationData) {
          migrationData = {
            pos: 0
          };
        }
        
        return migrationData;
      })
      .asCallback(callback);
  };

  const isUp = (process.argv[3] !== 'down');

  const callback = function (err) {
    if (err) {
      throw err;
    }
    console.log('Migration completed');
    process.exit(0);
  };

  if (isUp) {
    console.log('migrating up');
    migration.up(callback);
  } else {
    console.log('migrating down');
    migration.down(callback);
  }
};
