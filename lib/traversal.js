/**
 * Class to facilitate looking up Bible passages in multiple translations.
 */

'use strict';

//const axios = require('axios');
//const chapterAndVerse = require('chapter-and-verse');

module.exports = class Traversal {

    apiBaseURL =  'https://api.scripture.api.bible/v1';
    apiKey = null;

    language = 'English';
    translations = [ 'KJV' ];

    /**
     * Create a Traversal object.
     */
    constructor( apiKey ) {
      this.apiKey = apiKey;
    }
}
