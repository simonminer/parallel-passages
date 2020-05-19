'use strict';

/*
 * tranversal.test.json - Tests for instances of the Traversal class.
 *
 */

const traversals = require( '../traversal' );
const Traversal = traversals.Traversal;

test( "constructor", () => {
    const foo = "bar";
    const traversal = new Traversal( foo );
    expect( traversal instanceof Traversal ).toBe( true );
    expect( traversal.foo ).toBe( "bar" );
});
