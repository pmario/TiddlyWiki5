/*\
title: $:/core/modules/filters/compound-field-names.js
type: application/javascript
module-type: filteroperator

Returns the sub-entry titles of a compound tiddler in their original order.
Entries of the schema named by inherit-schema or inherit-compound come first,
then any additional entries of the tiddler itself.
The :visible suffix drops entries whose hide-filter header yields anything.

\*/

"use strict";

function extractFieldNames(text) {
	var names = [];
	if(!text) return names;
	var rawEntries = text.split(/\r?\n\+\r?\n/);
	for(var t = 0; t < rawEntries.length; t++) {
		var split = rawEntries[t].split(/\r?\n\r?\n/mg);
		if(split.length >= 1) {
			var entryFields = $tw.utils.parseFields(split[0]);
			if(entryFields.title && names.indexOf(entryFields.title) === -1) {
				names.push(entryFields.title);
			}
		}
	}
	return names;
}

// The header is read through compound-field-meta so the schema applies, and the filter runs with
// currentTiddler set to the record
function isVisible(wiki,widget,title,fieldName) {
	var fakeWidget = widget.makeFakeWidgetWithVariables({currentTiddler: title, fieldName: fieldName});
	var hideFilter = wiki.filterTiddlers("[<currentTiddler>compound-field-meta:hide-filter<fieldName>]",fakeWidget)[0];
	return !hideFilter || wiki.filterTiddlers(hideFilter,fakeWidget).length === 0;
}

exports["compound-field-names"] = function(source,operator,options) {
	var results = [],
		widget = options.widget || $tw.rootWidget;
	source(function(tiddler,title) {
		if(tiddler && (tiddler.fields.type === "text/vnd.tiddlywiki-multiple" ||
			tiddler.fields.type === "text/vnd.tiddlywiki-multiple+fields")) {
			var schema = $tw.utils.getCompoundSchema(options.wiki,tiddler),
				schemaTiddler = schema ? options.wiki.getTiddler(schema.title) : null,
				names = schemaTiddler ? extractFieldNames(schemaTiddler.fields.text) : [];
			var tiddlerNames = extractFieldNames(tiddler.fields.text);
			for(var j = 0; j < tiddlerNames.length; j++) {
				if(!names.includes(tiddlerNames[j])) {
					names.push(tiddlerNames[j]);
				}
			}
			for(var n = 0; n < names.length; n++) {
				if(!results.includes(names[n]) && (operator.suffix !== "visible" || isVisible(options.wiki,widget,title,names[n]))) {
					results.push(names[n]);
				}
			}
		}
	});
	return results;
};
