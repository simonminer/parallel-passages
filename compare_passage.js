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

logger.debug( `${path.basename( process.argv[1] )} starting run...` );

var translations = undefined;
( async () => {
    try {
        translations = await getBibleTranslationMap();
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
        string: [
            "language"
        ],
        boolean: [
            'verbose'
        ],
        default: {
            language: "English",
            verbose: false
        },
        alias: {
            l: 'language',
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
 * const responseBody = executeApiRequest( path );
 *
 * Performs an HTTP request on the specified API path.
 * Returns  the data from the response body
 * if the request is successful, and throws
 * an error otherwise.
 */
async function executeApiRequest( path ) {
    if ( !path ) {
        throw "No path specified to 'executeApiRequest' function";
    }

    const url = process.env.API_BASE_URL + path;
    const headers = {
        accept: '*/*',
        "api-key": process.env.API_KEY
    };

    logger.debug( `Requesting URL ${url}...` );
    var responseBody;
    await axios.get( url, { headers: headers } )
        .then( response => {
            responseBody = response.data;
        })
        .catch( ( err ) => {
            throw `Error requesting URL ${url}: ${err}`;
        });
    
    return responseBody;
}

/*
 * const translationMap = getBibleTranslationMap();
 *
 * Retrieve Bible translation data as a dictionary
 * mapping translation name or abbreviation to id.
 */

async function getBibleTranslationMap () {

    logger.debug( "Loading Bible translation data." );
    var bibles;

    try {

        // Is recent Bible translation data not locally available?
        const biblesFile  = process.env.CACHE_DIRECTORY + "/bibles.json";
        if ( !fs.existsSync( biblesFile )
            || fs.statSync( biblesFile ).mtime.getTime() < ( Date.now() - process.env.CACHE_TTL ) ) {

            // Fetch Bible translation data via the API.
            logger.debug( "Requesting  Bible translation data from server." );
            bibles = await executeApiRequest( "/bibles" );

            // Store the Bible translation data locally.
            logger.debug( `Writing Bible translation data to file ${biblesFile}` );
            fs.writeFileSync( biblesFile, JSON.stringify( bibles, null, 4 ) );
        }

        // Otherwise, read the Bible translation data from the local file.
        else {
            logger.debug( `Reading Bible translation data from file ${biblesFile}` );
            bibles = JSON.parse( fs.readFileSync( biblesFile ) );
        }

    }
    catch ( err ) {
        throw `Error loading Bible translation data: ${err}`;
    }

    // Generate the Bible translation map.
    var translationMap = {};
    var translationCount = 0;
    bibles.data.forEach( function ( bible ) {
        if ( bible.language.name == options.language ) {
            translationMap[ bible.nameLocal ] = bible.id;
            translationMap[ bible.abbreviationLocal ] = bible.id;
            translationCount += 1;
        }
    });
    logger.debug( `Loaded data for ${translationCount} ${options.language} Bible ` 
        + ( translationCount == 1 ? "translation" : "translations" ) 
        + '.' );

    return translationMap;
}

