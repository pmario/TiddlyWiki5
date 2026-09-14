/*\
title: $:/plugins/tiddlywiki/hard-line-breaks/serialize-ssnl.js
type: application/javascript
module-type: wikiruleserializer

Serializes a break made by two spaces before the line end for the wikitext-serialize plugin

\*/

"use strict";

exports.name = "ssnl";

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	// The source slice keeps the plain two-spaces form and a CRLF line end;
	// the backslash form survives editors that trim trailing whitespace
	var slice = $tw.utils.serializeFromSource(tree,{source: options.source});
	return slice !== null ? slice : "  \\\n";
};
