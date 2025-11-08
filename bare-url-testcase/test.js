'use strict';

console.log('--- Bare URL Bug Test Case ---');
console.log('This script tests two URL parsing methods that cause the Bare runtime to crash.');

// --- Test Case 1: Legacy url.parse() via npm alias ---
try {
    console.log('\n[1] Testing legacy url.parse()...');
    const url = require('url');
    console.log('[1] require("url") succeeded.');
    
    const testUrlString = '/';
    console.log(`[1] Calling url.parse("${testUrlString}")...`);
    
    const parsed = url.parse(testUrlString);
    
    if (parsed === null) {
        throw new Error('url.parse() returned null, which is incorrect. It should return a URL object.');
    }
    if (typeof parsed !== 'object') {
        throw new Error(`url.parse() returned a ${typeof parsed} instead of an object.`);
    }
    
    console.log('[1] SUCCESS: url.parse() did not crash and returned an object.');
    console.log('[1] Result:', parsed);

} catch (e) {
    // This block will likely not be reached if it's a native crash
    console.error('[1] ERROR: Caught a JavaScript exception:\n', e);
}

// This part of the script will not be reached if Test Case 1 crashes.
// To test separately, comment out Test Case 1.

// --- Test Case 2: Modern new URL() ---
try {
    console.log('\n[2] Testing modern new URL()...');
    
    const testUrlString = '/';
    const testBase = 'http://localhost:8080';
    console.log(`[2] Calling new URL("${testUrlString}", "${testBase}")...`);
    
    const parsed = new URL(testUrlString, testBase); // This is also expected to crash the process
    
    console.log('[2] SUCCESS: new URL() did not crash.');
    console.log('[2] Result:', parsed);

} catch (e) {
    // This block will likely not be reached if it's a native crash
    console.error('[2] ERROR: Caught a JavaScript exception:', e);
}

// --- Test Case 3: Legacy querystring.parse() via npm alias ---
try {
    console.log('\n[3] Testing legacy querystring.parse()...');
    const querystring = require('querystring');
    console.log('[3] require("querystring") succeeded.');
    
    const testQueryString = 'param1=value1&param2=value2';
    console.log(`[3] Calling querystring.parse("${testQueryString}")...`);
    
    const parsed = querystring.parse(testQueryString); // This is expected to crash
    
    console.log('[3] SUCCESS: querystring.parse() did not crash.');
    console.log('[3] Result:', parsed);

} catch (e) {
    console.error('[3] ERROR: Caught a JavaScript exception:', e);
}

console.log('\n--- Test Case Complete ---');
