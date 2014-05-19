'use strict';

var assign = require( 'object.assign' );
var escodegen = require( 'escodegen' );
var esprima = require( 'esprima' );
var fs = require( 'fs' );
var chalk = require( 'chalk' );
var path = require( 'path' );
var strip = require( './lib/strip' );

/**
 * @typedef {Object} MinErrStripOptions
 * @property {String} docsUrl
 * @property {String} configDest - The file that should be created to contain the stripped error messages
 * @property {RegExp} [urlReplacement]
 * @property {String} [productionTemplate]
 * @property {String} [parsedFileFormat] - The format object passed to {@link escodegen.generate} when
 *  generating the final version of processed module templates
 * @property {Function} [logger] - This should have log and error functions. If not provided
 *  the one from the gulp utility package will be used.
 * @property {Object} [configDetails] - Additional configuration properties to be added to the output config
 */

/**
 *
 * @param {MinErrStripOptions} options
 * @constructor
 */
var MinErrStrip = function MinErrStrip( options ) {

  if ( !options ) {
    throw new Error( 'An options object must be passed into the MinErrStrip constructor' );
  }

  var defaultLogger = {
    log: console.log,
    error: function (msg) {
      console.error( chalk.white.bgRed.bold( ( 'ERROR: ' + msg ) ) );
    }
  };

  /**
   * Merge the supplied options with the defaults.
   *
   * @type {MinErrStripOptions}
   */
  this.options = assign(
    {
      logger: defaultLogger,
      productionTemplate: path.resolve( __dirname + '/lib/minErr.tpl.js' ),
      parsedFileFormat: {
        indent: {
          style: '  ',
          base: 0
        }
      },
      configDetails: {
        generated: new Date().toString()
      },
      urlReplacement: /MINERR_URL/
    },
    options
  );

  if ( !this.options.docsUrl ) {
    throw new Error( 'options.docsUrl must be set in the MinErrStrip options' );
  }

  if ( !this.options.configDest ) {
    throw new Error( 'options.configDest must be set in the MinErrStrip options' );
  } else if ( false === fs.existsSync( path.dirname( this.options.configDest ) ) ) {
    throw new Error( 'The directory for the file defined in options.configDest must exist' );
  }

  /**
   * Storage for the strip tool so that we are only building it once
   *
   * @type {strip}
   */
  this.strip = null;

  /**
   * Storage for the error templates that are stripped from modules. These should be dumped
   * to a json config array after the last module is parsed.
   *
   * @type {Object}
   */
  this.strippedErrorStorage = {};
};

/**
 * Return the string content of the template specified in {@link MinErrStripOptions.productionTemplate} with
 * {@link MinErrStripOptions.urlReplacement} replaced with {@link MinErrStripOptions.docsUrl}
 *
 * @private
 *
 * @returns {String}
 */
MinErrStrip.prototype.getProductionSource = function getProductionSource() {
  return fs
    .readFileSync( this.options.productionTemplate, 'utf8' )
    .replace( this.options.urlReplacement, this.options.docsUrl );
};

/**
 * @private
 *
 * Instantiate the stripping utility if a previously cached one is not present then return
 * the {@link strip} instance.
 *
 * @returns {strip}
 */
MinErrStrip.prototype.getStripUtil = function getStripUtil() {
  if ( null === this.strip ) {
    this.strip = strip( {
      logger: this.options.logger,
      minErrAst: this.stringToAST( this.getProductionSource() ).body[0]
    } );
  }

  return this.strip;
};

/**
 * @private
 *
 * @param {String} contents - The string file contents
 * @param {Object} [options] - Optional options to pass to the parser
 *
 * @returns {*} - The template in AST form
 */
MinErrStrip.prototype.stringToAST = function stringToAST( contents, options ) {
  options = options || {};

  return esprima.parse( contents, options );
};

/**
 * Strips the error templates from the file AST and stores them for later
 * writing to the error config file.
 *
 * @private
 *
 * @param  {Syntax.Program} fileAST
 *
 * @returns {Syntax.Program} - The parsed AST
 */
MinErrStrip.prototype.stripErrorsFromAST = function stripErrors( fileAST ) {
  var strip = this.getStripUtil();

  return strip( fileAST, this.strippedErrorStorage );
};

/**
 * @private
 *
 * @param {Syntax.Program} fileAST
 *
 * @returns {String} - The AST converted back to a string
 */
MinErrStrip.prototype.astToString = function astToString( fileAST ) {
  return escodegen.generate( fileAST, {format: this.options.parsedFileFormat} );
};

/**
 * @param {String} fileContents
 *
 * @returns {String} - The file contents with the error strings replaced and the error function patched
 */
MinErrStrip.prototype.processModule = function processModule( fileContents ) {
  var parsedAST = this.stripErrorsFromAST(
    this.stringToAST( fileContents, {loc: true} )
  );

  return this.astToString( parsedAST );
};

/**
 * Construct the options object then write it out to the configured configuration file
 */
MinErrStrip.prototype.flushErrorConfig = function getStrippedErrors() {
  var errorOptions = assign(
    this.options.configDetails,
    {errors: this.strippedErrorStorage}
  );

  this.writeConfigFile(
    this.options.configDest,
    errorOptions
  );
  // reset storage
  this.strippedErrorStorage = {};
};

/**
 * @private
 *
 * @param {String} writeConfigTo - The path that the config should be written to
 * @param {object} data - An object containing the data to write to the config
 */
MinErrStrip.prototype.writeConfigFile = function writeConfigFile( writeConfigTo, data ) {

  fs.writeFile( path.resolve( writeConfigTo ), JSON.stringify( data ), function ( err ) {
    if ( err ) {
      throw new Error( err );
    }
  } );

};

module.exports = MinErrStrip;
