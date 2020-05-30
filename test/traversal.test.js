'use strict';

/*
 * tranversal.test.json - Tests for instances of the Traversal class.
 *
 */

const apiKey = 'test';
const apiBaseURL = 'https://api.scripture.api.bible/v1';
const language = 'English';
const translation = 'KJV';

const Traversal = require( '../lib/traversal' );

test( 'constructor and default field values', () => {
    const traversal = new Traversal( apiKey );
    expect( traversal instanceof Traversal ).toBe( true );
    expect( traversal.language ).toBe( language );
    expect( Array.isArray( traversal.translations ) ).toBe( true );
    expect( traversal.translations.length ).toBe( 1 );
    expect( traversal.translations[0] ).toBe( translation );
    expect( traversal.apiKey ).toBe( apiKey );
    expect( traversal.apiBaseURL ).toBe( apiBaseURL );
});
