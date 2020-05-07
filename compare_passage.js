#!/usr/bin/env node
"use strict";

/********************* Library Imports and Global Constants Setup ***********************/
const fs = require("fs");
const path = require("path");
const util = require('util');
const getopts = require("getopts")
require('dotenv-safe').config();
const exec = util.promisify(require("child_process").exec);

const options = getCommandLineOptions();
var logger = getLogger();

/********************************** Functions *************************************/

/*
 * const options = getCommandLineOptions();
 *
 * Parse command line options given to the program
 * and return them in a hash.
 */
function getCommandLineOptions() {
  const options = getopts(process.argv.slice(2), {
    alias: {
    },
    string: [
    ],
    boolean: [
    ],
    default: {
    }
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
  const log_directory = "./logs";
  require('winston-daily-rotate-file');
  const logFormat = printf(({
    level,
    message,
    timestamp
  }) => {
    return `${timestamp} [${level} - ${message}`;
  });
  let filename = path.join(log_directory, `${path.basename( process.argv[1] )}`);

  const logger = createLogger({
    level: options['log-level'],
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
