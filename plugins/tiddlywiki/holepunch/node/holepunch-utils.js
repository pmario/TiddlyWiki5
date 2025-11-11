/*\
title: $:/plugins/tiddlywiki/holepunch/node/holepunch-utils.js
type: application/javascript
module-type: utils-node

A replacement for filesystem.js that uses a Holepunch P2P network for storage.

\*/

"use strict";

const Corestore = require('corestore');
const Hyperswarm = require('hyperswarm');
const Autobase = require('autobase');
const ram = require('random-access-memory');

// This object will hold the state of our P2P stack
const p2p = {
    store: null,
    swarm: null,
    autobase: null,
    localCore: null,
    isReady: false
};

// The init function is not exported, but needs to be called by a custom
// server command on startup.
function init(callback) {
    if (p2p.isReady) {
        return callback(null);
    }
    console.log("Initializing Holepunch P2P Engine...");

    p2p.store = new Corestore(ram); // Use 'random-access-file' for persistence
    p2p.localCore = p2p.store.get({ name: 'local-writer' });
    p2p.swarm = new Hyperswarm();
    p2p.autobase = new Autobase({
        inputs: [p2p.localCore],
        localInput: p2p.localCore
    });

    p2p.swarm.on('connection', (socket) => p2p.store.replicate(socket));

    // TODO: Join a swarm topic, listen for updates, etc.

    p2p.isReady = true;
    console.log("Holepunch P2P Engine Initialized (placeholder)");
    if (callback) {
        callback(null);
    }
}

// Call init for now, in a real implementation this would be handled by the server startup
init(() => {});


/*
Create a fileInfo object for saving a tiddler. In the P2P context, this is
less about file paths and more about how the tiddler is represented in the log.
*/
exports.generateTiddlerFileInfo = function(tiddler, options) {
	// For a P2P system, the concept of a "file" is abstract.
	// We can return a simplified fileInfo object. The 'filepath' can be the title.
	const title = tiddler.fields.title;
	console.log(`P2P: Generating file info for "${title}"`);
	return {
		title: title,
		filepath: title, // The 'filepath' is just the title in our abstract system
		type: tiddler.fields.type || "text/vnd.tiddlywiki",
		hasMetaFile: false // We store all fields in a single log entry
	};
};

/*
Generate the filepath for saving a tiddler. In the P2P context, this is trivial.
*/
exports.generateTiddlerFilepath = function(title, options) {
	// No real file paths, so we just return the title.
	return title;
};

/*
Save a tiddler to the P2P log. This function mimics 'saveTiddlerToFile'.
*/
exports.saveTiddlerToFile = function(tiddler, fileInfo, callback) {
	const title = tiddler.fields.title;
	console.log(`P2P: Saving tiddler "${title}" to Autobase log`);

	if (!p2p.isReady) {
		const err = "P2P system is not ready.";
		console.error(err);
		return callback(err);
	}

	const operation = {
		type: 'put',
		key: title,
		value: tiddler.getFieldStrings()
	};

	// TODO: Actually append to the autobase log
	// await p2p.autobase.append(JSON.stringify(operation));

	// We'll just simulate a successful save for now.
	callback(null, fileInfo);
};

/*
Delete a tiddler from the P2P log. This function mimics 'deleteTiddlerFile'.
*/
exports.deleteTiddlerFile = function(fileInfo, callback) {
	const title = fileInfo.title || fileInfo.filepath;
	console.log(`P2P: Deleting tiddler "${title}" from Autobase log`);

	if (!p2p.isReady) {
		const err = "P2P system is not ready.";
		console.error(err);
		return callback(err);
	}

	const operation = {
		type: 'del',
		key: title
	};

	// TODO: Actually append the delete operation to the autobase log
	// await p2p.autobase.append(JSON.stringify(operation));

	// We'll just simulate a successful deletion for now.
	callback(null, fileInfo);
};

// Create dummy functions for other exports from filesystem.js so that the
// server doesn't crash if they are called.

exports.getSubdirectories = (dirPath) => null;
exports.copyDirectory = (src, dest) => "Not supported in P2P mode";
exports.copyFile = (src, dest) => null;
exports.removeTrailingSeparator = (dirPath) => dirPath;
exports.createDirectory = (dirPath) => null;
exports.createFileDirectories = (filePath) => null;
exports.deleteDirectory = (dirPath) => null;
exports.isDirectory = (dirPath) => false;
exports.isDirectoryEmpty = (dirPath) => true;
exports.deleteEmptyDirs = (dirpath, callback) => callback(null);
exports.generateTiddlerExtension = (title, options) => "";
exports.saveTiddlerToFileSync = (tiddler, fileInfo) => fileInfo;
exports.cleanupTiddlerFiles = (options, callback) => callback(null, options.bootInfo);