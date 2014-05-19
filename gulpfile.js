'use strict';

var gulp = require( 'gulp' );
var gJasmine = require( 'gulp-jasmine' );
var gJsHint = require( 'gulp-jshint' );
var gJscs = require( 'gulp-jscs' );

gulp.task( 'default', ['test'], function () {
  // nothing to do
} );

gulp.task( 'lint', function () {
  gulp.src( ['lib/*.js', 'spec/*.js', 'gulpfile.js', 'index.js' ] )
    .pipe( gJscs() )
    .pipe( gJsHint('.jshintrc') )
    .pipe( gJsHint.reporter('jshint-stylish'));
});

gulp.task( 'test', ['lint'], function () {
  gulp.src( 'spec/*.js' )
    .pipe( gJasmine() );

} );
