# minerr-strip

> Strips minErr error messages from your build.

## Install

````
npm install --save-dev minerr-strip
````

## Example

__This is essentially how the plugin is used in the [gulp-minerr-strip](https://www.npmjs.org/package/gulp-minerr-strip) package.__

````js

/**
 * @param {MinErrBuilderOptions} options
 */
function minerrStrip( options ) {
  'use strict';

  try {
    var minErrBuilder = new MinErrBuilder( options );
  } catch ( error ) {
    throw new PluginError( PLUGIN_NAME, error );
  }

  return through.obj(
    function transform( file, enc, done ) {
      var _this = this;

      if ( file.isNull() ) {
        this.push( file );

        return done();
      }

      function processFileContents(contents) {
        try {
          return minErrBuilder.processModule( contents );
        } catch (error) {
          _this.emit( 'error', new PluginError( PLUGIN_NAME, error) );
        }
      }

      if ( file.isBuffer() ) {
        file.contents = new Buffer( processFileContents( file.contents ) );
        this.push( file );

        return done();
      }

      if (!file.isStream()) {
        // Can there be another type?
        this.emit(
          'error',
          new PluginError( PLUGIN_NAME, 'File type was not buffer, stream or null and is therefor not supported' )
        );

        return done();
      }

      file.contents.pipe( es.wait( function ( err, data ) {
        file.contents = es.readArray( [ processFileContents( data ) ] );
        _this.push( file );
        done();
      } ) );

    },
    function flush( done ) {
      try {
        minErrBuilder.flushErrorConfig();
      } catch ( error ) {
        this.emit( 'error', new PluginError( PLUGIN_NAME, error ) );
      }

      return done();
    }
  );
}

````

## Contributing
Pull requests are welcome! Remember to keep the following rules in mind:
- All features or bug fixes must be documented by one or more specs. We use [Jasmine](http://pivotal.github.io/jasmine).
- Submissions must pass JSHint. Run `gulp lint` to check this.
- Instead of complex inheritance hierarchies, we prefer simple objects. We use prototypical inheritance only when absolutely necessary.
- We love functions and closures and, whenever possible, prefer them over objects.
