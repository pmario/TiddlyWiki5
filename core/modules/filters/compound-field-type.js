/*\
title: $:/core/modules/filters/compound-field-type.js
type: application/javascript
module-type: filteroperator

Returns the type header of a sub-entry in a compound tiddler.
A strict schema (inherit-schema) owns the entries it defines; a loose one
(inherit-compound) only fills in what the tiddler lacks.

\*/

"use strict";

exports["compound-field-type"] = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var type = $tw.utils.getCompoundFieldMeta(options.wiki,tiddler,operator.operand,"type");
		if(type) {
			results.push(type);
		}
	});
	return results;
};
