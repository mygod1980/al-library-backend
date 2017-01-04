'use strict';

require('app-module-path').addPath(__dirname);

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var stylish = require('jshint-stylish');
var watchify = require('watchify');
var minimist = require('minimist');

var knownOptions = {
  string: 'params',
  "default": {
    params: ''
  }
};

var options = minimist(process.argv.slice(2), knownOptions);

require('./config/init')();

var config = require('./config/config');

var sources = {
  server: {
    views: ['app/views/**/*.*'],
    js: ['runner.js', 'migrate-db.js', 'server.js', 'tools.js', 'config/**/*.js', 'app/**/*.js', 'migrations/**/*.js']
  }
};

var debugPort = process.env.DEBUG_PORT || 5858;

gulp.task('jshint', function () {
  return gulp.src(sources.server.js)
    .pipe($.plumber())
    .pipe($.jshint())
    .pipe($.jshint.reporter(stylish));
});

gulp.task('lint', ['jshint']);

gulp.task('watch', [], function () {
  var readDelay;
  readDelay = 2000;
  $.nodemon({
    script: 'runner.js',
    args: ['server'],
    ext: 'js',
    nodeArgs: ['--debug=' + debugPort],
    watch: sources.server.js.concat(sources.server.views)
  }).on('change', ['jshint', 'apidoc']);

  return gulp.watch(sources.server.views.concat(sources.server.js), {
    debounceDelay: readDelay
  }, ['jshint', 'apidoc']);
});

gulp.task('tool', function () {
  return $.run('node runner.js tools.js ' + options.params).exec();
});

gulp.task('migrate', function () {
  return $.run('node runner.js migrate-db.js ' + options.params).exec();
});

gulp.task('apidoc', function (done) {
  $.apidoc({
    config: '.',
    src: 'app/',
    dest: 'apidocs/',
    includeFilters: ['.*\\.js$']
  }, done);
});

gulp.task('test', function () {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Wrong NODE_ENV value. Tests must be ran with "test"');
  }
  return require('test/test')(options.params);
});

gulp.task('install', ['migrate', 'apidoc']);

gulp.task('run', function () {
  return require('server')(options.params);
});

gulp.task('dev', ['lint', 'watch']);

gulp.task('default', [process.env.NODE_ENV === 'production' ? 'run' : 'dev']);
