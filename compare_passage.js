#!/usr/bin/env node
"use strict";

/********************* Library Imports and Global Constants Setup ***********************/

const fs = require("fs");
const path = require("path");
const util = require('util');
const getopts = require("getopts")
require('dotenv-safe').config();
const exec = util.promisify(require("child_process").exec);
const axios = require("axios");

const options = getCommandLineOptions();
var logger = getLogger();

/********************************** Main Program *************************************/

logger.debug( `${path.basename( process.argv[1] )} starting run ...` );

// Translations are in a comma-separated list in the --translations/-t CLI argument.
const translations = options.translations.toLowerCase().split( /\s*,\s*/ );
const reference = options._.length ? options._[0] : null;
if ( reference == null) {
   logger.error( "Please specifiy a Bible verse or passage reference." ) ;
    process.exit();
}

( async () => {
    try {
        const translationMap = await getBibleTranslationMap();
        // Look up books from the KJV or the first translation passed to the program
        const bookTranslation = "kjv" in translationMap ? "kjv" : translations[0];
        const bookMap = await getBibleBookMap( translationMap[ bookTranslation ] );
        const passage = parseReference( reference, bookMap );
    }
    catch ( err ) {
        logger.error( `${path.basename( process.argv[1] )} aborting with error: ${err}` );
    }
})();

/********************************** Functions *************************************/

/*
 * const options = getCommandLineOptions();
 *
 * Parse command line options given to the program
 * and return them in a hash.
 */
function getCommandLineOptions() {
    const options = getopts(process.argv.slice(2), {
        boolean: [
            'verbose'
        ],
        string: [
            "api-base-url", "api-key", "cache-directory", "cache-ttl", "language",
            'translations'
        ],
        default: {
            "api-base-url": process.env.API_BASE_URL,
            "api-key": process.env.API_KEY,
            "cache-directory": process.env.CACHE_DIRECTORY,
            "cache-ttl": process.env.CACHE_TTL,
            language: "English",
            translations: "KJV",
            verbose: true
        },
        alias: {
            k: 'api-key',
            l: 'language',
            t: 'translations',
            v: 'verbose'
        },
    });
    return options;
}

/*
 * var logger = getLogger();
 *
 * Creates and returns a (Winston) logger object.
 *
 */
function getLogger() {
    const {
        createLogger,
        format,
        transports
    } = require('winston');

    const {
        combine,
        timestamp,
        label,
        printf
    } = format;

    require('winston-daily-rotate-file');
    const logFormat = printf(({
    level,
        message,
        timestamp
    }) => {
        return `${timestamp} [${level}] - ${message}`;
    });

    const logDirectory = "./logs";
    let filename = path.join(logDirectory, `${path.basename( process.argv[1] )}`);

    const logger = createLogger({
        level: options.verbose ? "debug" : "info",
        format: combine(
            timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            format.errors({
                stack: true
            }),
            logFormat
        ),
        transports: [
            new transports.DailyRotateFile({
                datePattern: 'YYYY-MM-DD',
                filename: `${filename}.log`
            }),
            new transports.Console()
        ]
    });

    return logger;
}

/*
 * const responseBody = executeApiRequest( apiPath );
 *
 * Performs an HTTP request on the specified API path.
 * Returns  the data from the response body
 * if the request is successful, and throws
 * an error otherwise.
 */
async function executeApiRequest( apiPath ) {
    if ( !apiPath ) {
        throw "No API path specified to 'executeApiRequest' function";
    }

    const url = options['api-base-url'] + apiPath;
    const headers = {
        accept: '*/*',
        "api-key": options['api-key']
    };

    logger.debug( `Requesting URL ${url} ...` );
    var responseBody;
    await axios.get( url, { headers: headers } )
        .then( response => {
            responseBody = response.data;
        })
        .catch( ( err ) => {
            throw `Error requesting URL ${url}: ${err}`;
        });

    // Make sure data was returned by the request.
    if (responseBody.data.length == 0) {
        throw `No data returned from request to URL: ${url}`;
    }

    return responseBody;
}

/*
 * const data  = loadData( file, apiPath );
 *
 * Reads JSON from the specified file (basename) or
 * API path (if the file is unavailable or stale).
 * If the data is retrieved from the API, this
 * function saves it to the given file so
 * it will be available locally later.
 */
async function loadData ( file, apiPath ) {
    if ( !file ) {
        throw "No filespecified to 'loading' function";
    }
    if ( !apiPath ) {
        throw "No API path specified to 'loading' function";
    }

    var type = file.match(/([^\/]+)\.\w+$/)[1];

    var data;
    try {

        // Is recent data not locally available?
        const dataFile  = options['cache-directory'] + "/" + file;
        if ( !fs.existsSync( dataFile )
            || fs.statSync( dataFile ).mtime.getTime() < ( Date.now() - options['cache-ttl'] ) ) {

            // Fetch data via the API.
            logger.debug( `Requesting ${type} data from server.` );
            data = await executeApiRequest( apiPath );

            // Store the data locally.
            logger.debug( `Writing ${type} data to file ${dataFile}.` );
            fs.writeFileSync( dataFile, JSON.stringify( data, null, 4 ) );
        }

        // Otherwise, read the data from the local file.
        else {
            logger.debug( `Reading ${type} data from file ${dataFile}.` );
            data = JSON.parse( fs.readFileSync( dataFile ) );
        }

    }
    catch ( err ) {
        throw `Error loading ${type} data: ${err}`;
    }

    return data;
}

/*
 * const translationMap = getBibleTranslationMap();
 *
 * Retrieves Bible translation data as a dictionary
 * mapping translation name or abbreviation to id.
 */
async function getBibleTranslationMap () {

    logger.debug( "Loading Bible translation data." );
    const bibles = await loadData( 'bibles.json', '/bibles' );

    // Generate the Bible translation map.
    var translationMap = {};
    var translationCount = 0;
    bibles.data.forEach( function ( bible ) {
        if ( bible.language.name == options.language ) {
            translationMap[ bible.nameLocal.toLowerCase() ] = bible.id;
            translationMap[ bible.abbreviationLocal.toLowerCase() ] = bible.id;
            translationCount += 1;
        }
    });
    logger.debug( `Loaded data for ${translationCount} ${options.language} Bible ` 
        + ( translationCount == 1 ? "translation" : "translations" ) 
        + '.' );

    return translationMap;
}

/*
 * const bookMap = getBibleBookMap( translationId );
 *
 * Retrieves Bible book data as a dictionary
 * mapping book name and abbreviation to id.
 */
async function getBibleBookMap ( translationId ) {

    logger.debug( "Loading Bible book data." );
    const books = await loadData( 'books.json', `/bibles/${translationId}/books` );

    // Generate the Bible books map.
    var bookMap = {};
    var bookCount = 0;
    books.data.forEach( function ( book ) {
        bookMap[ book.name.toLowerCase() ] = book.id;
        bookMap[ book.abbreviation.toLowerCase() ] = book.id;
        bookCount += 1;
    });
    logger.debug( `Loaded data for ${bookCount} books of the Bible.`  );

    return bookMap;
}

/*
 * const passage = parseReference( reference, bookMap );
 *
 * Parses the specified reference, doing some rudimentary
 * validation, and returning a passage identifier suitable
 * for passing to the API
 */
function parseReference( reference, bookMap ) {
    const referenceParts = reference.match( /^(.+?)(\s+(\d.*))?$/ );

    // Parse and map the Bible book name.
    const bookName = referenceParts[1].toLowerCase();
    var passageParts = [];
    if (!bookName) {
        throw `No book name found in Bible reference ${reference}`;
    }
    else if ( !( bookName in bookMap ) ) {
        throw `Invalid Bible book name or abbreviation: ${bookName}`;
    }
    else {
        passageParts.push( bookMap[bookName] );
    }

    // Normalize the chapter and verse numbers.
    if ( referenceParts[3] ) {
        const chapterAndVerse = referenceParts[3].replace( /\s*:\s*/, '.' );
        passageParts.push( chapterAndVerse );
    }

    // Put it all together.
    const passage = passageParts.join( '.' );
    logger.debug( `Bible reference "${reference}" maps to passage "${passage}".` );

    return passage;
}
