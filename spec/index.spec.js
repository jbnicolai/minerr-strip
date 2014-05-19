var MinErrStrip = require( '../index.js' );
var fs = require( 'fs' );

describe( 'minErrBuild', function () {
  'use strict';
  var optionsFixture, minErrBuilder;

  beforeEach( function () {
    optionsFixture = {docsUrl: 'http://docs.example.com', configDest: 'should-never-be-written.json'};
    // make sure that we are not ever actually writing out a file
    minErrBuilder = new MinErrStrip( optionsFixture );
    spyOn( minErrBuilder, 'writeConfigFile' );
  } );

  describe( '#getProductionSource()', function () {
    it( 'should return the included minErr script with the docs url replaced by default', function () {
      var expected = fs.readFileSync( 'lib/minErr.tpl.js', 'utf8' ).replace( /MINERR_URL/, optionsFixture.docsUrl );

      expect( minErrBuilder.getProductionSource().trim() ).toEqual( expected.trim() );
    } );
  } );

  describe( '#stripErrorContent()', function () {
    it( 'should replace the error handler and remove the error template from the passed in fixture', function () {
      var fixture = fs.readFileSync( 'fixtures/test1.js', 'utf8' ),
          expected = fs.readFileSync( 'fixtures/expected/test1.js', 'utf8' );
      expect( minErrBuilder.processModule( fixture ).trim() ).toEqual( expected.trim() );
    } );
  } );

  describe( '#flushErrorConfig', function () {
    it( 'should call writeConfigFile with the correct file path and data', function () {
      var expectedErrorData = {
        generated: new Date().toString(),
        errors: {
          test: {one: 'Herp! A {0} happened', two: '{0} {1} {2}'},
          derp: {herp: 'I accidentally {0}'}
        }
      };

      minErrBuilder.processModule( fs.readFileSync( 'fixtures/test1.js', 'utf8' ) );
      minErrBuilder.processModule( fs.readFileSync( 'fixtures/test2.js', 'utf8' ) );

      minErrBuilder.flushErrorConfig();

      expect( minErrBuilder.writeConfigFile ).toHaveBeenCalledWith( optionsFixture.configDest, expectedErrorData );
    } );

    it( 'should reset the storage object after writing the config when flush is called', function () {
      minErrBuilder.processModule( fs.readFileSync( 'fixtures/test1.js', 'utf8' ) );
      minErrBuilder.flushErrorConfig();
      expect( minErrBuilder.strippedErrorStorage ).toEqual( {} );
    } );

  } );
} );
