'use strict';

/*
 * tranversal.test.json - Tests for instances of the Traversal class.
 *
 */

const Traversal = require( '../lib/traversal' );

test( 'constructor and default field values', () => {
    const traversal = new Traversal();
    expect( traversal instanceof Traversal ).toBe( true );
    expect( traversal.language ).toBe( 'English' );
    expect( Array.isArray( traversal.translations ) ).toBe( true );
    expect( traversal.translations.length ).toBe( 1 );
    expect( traversal.translations[0] ).toBe( 'KJV' );
});
