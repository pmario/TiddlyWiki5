/*\
title: $:/core/modules/utils/compound-fields.js
type: application/javascript
module-type: utils

Schema resolution, header lookup and schema materialization for compound +fields tiddlers.

\*/

"use strict";

var COMPOUND_TYPES = {"text/vnd.tiddlywiki-multiple": true, "text/vnd.tiddlywiki-multiple+fields": true};

/*
Returns {title, strict} for the schema a tiddler follows, or null. inherit-schema makes the schema own
every entry it defines (strict); inherit-compound lets the tiddler's own headers win (loose)
*/
exports.getCompoundSchema = function(wiki,tiddler) {
	if(!tiddler || !COMPOUND_TYPES[tiddler.fields.type]) {
		return null;
	}
	var strict = !!tiddler.fields["inherit-schema"],
		title = strict ? tiddler.fields["inherit-schema"] : tiddler.fields["inherit-compound"];
	// A pointer to the tiddler itself or to a missing tiddler is ignored
	if(!title || title === tiddler.fields.title || !(wiki.tiddlerExists(title) || wiki.isShadowTiddler(title))) {
		return null;
	}
	return {title: title, strict: strict};
};

function getEntries(wiki,titleOrTiddler) {
	return wiki.getTiddlerData(titleOrTiddler) || {};
}

function getHeader(entry,propertyName) {
	return (entry !== null && typeof entry === "object" && $tw.utils.hop(entry,propertyName)) ? entry[propertyName] : null;
}

function getHeaders(entry) {
	var headers = {};
	if(entry !== null && typeof entry === "object") {
		$tw.utils.each(entry,function(value,name) {
			if(name !== "value") {
				headers[name] = value;
			}
		});
	}
	return headers;
}

function sameHeaders(a,b) {
	var names = Object.keys(a);
	return names.length === Object.keys(b).length && names.every(function(name) {
		return $tw.utils.hop(b,name) && b[name] === a[name];
	});
}

/*
Returns header propertyName of sub-entry fieldName, or null. A strict schema owns every entry it
defines, so the tiddler's own headers for that entry are never consulted; a loose schema only fills
in headers the tiddler lacks
*/
exports.getCompoundFieldMeta = function(wiki,tiddler,fieldName,propertyName) {
	if(!tiddler || !COMPOUND_TYPES[tiddler.fields.type]) {
		return null;
	}
	var schema = exports.getCompoundSchema(wiki,tiddler),
		schemaEntries = schema ? getEntries(wiki,schema.title) : {},
		own = getHeader(getEntries(wiki,tiddler)[fieldName],propertyName);
	if(schema && $tw.utils.hop(schemaEntries,fieldName)) {
		var inherited = getHeader(schemaEntries[fieldName],propertyName);
		return schema.strict ? inherited : (own !== null ? own : inherited);
	}
	return own;
};

/*
Returns the tiddler with a strict schema's headers written into the entries the schema defines, so
the record is self-describing wherever it travels. Loose schemas and drafts leave the text untouched
*/
exports.materializeCompoundSchema = function(wiki,tiddler) {
	var schema = exports.getCompoundSchema(wiki,tiddler);
	if(!schema || !schema.strict || tiddler.fields["draft.of"] || !tiddler.fields.text) {
		return tiddler;
	}
	var schemaEntries = getEntries(wiki,schema.title),
		data = $tw.utils.parseMultilineFields(tiddler.fields.text),
		changed = false;
	$tw.utils.each(data,function(entry,name) {
		if(!$tw.utils.hop(schemaEntries,name)) {
			return;
		}
		var headers = getHeaders(schemaEntries[name]);
		if(!sameHeaders(headers,getHeaders(entry))) {
			var value = getHeader(entry,"value") !== null ? entry.value : entry;
			data[name] = Object.keys(headers).length ? $tw.utils.extend({value: value},headers) : value;
			changed = true;
		}
	});
	return changed ? new $tw.Tiddler(tiddler,{text: $tw.utils.makeMultilineFieldsDictionary(data,tiddler.fields.text)}) : tiddler;
};
