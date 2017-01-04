/**
 * Created by eugenia on 03/03/15.
 */
'use strict';

require('app-module-path').addPath(__dirname);

console.log('Loading ' + process.argv[2] + '...');

require(process.argv[2])();
