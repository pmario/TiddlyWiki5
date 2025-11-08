'use strict'

// 1. Get the Bare process module.
const process = require('process');

// 2. Set up the global process object that TiddlyWiki expects.
global.process = process;

// 3. The 'require' function here is the one provided by the Bare runtime.
// With npm aliases, require('fs') should now correctly resolve.
const $tw = require('./boot/boot.js').TiddlyWiki();

// 4. Pass the command line arguments to TiddlyWiki dynamically.
const realArgs = process.argv.slice(2);

// Construct the argv that TiddlyWiki's boot process expects.
$tw.boot.argv = [
    ...realArgs // Pass along all the other arguments
];

$tw.boot.boot();
