/*\
title: $:/core/modules/filters/compound-schema.js
type: application/javascript
module-type: filteroperator

Returns the schema tiddler each input follows through inherit-schema or
inherit-compound, or nothing for a self-contained tiddler. The suffix "strict"
keeps only inherit-schema results, any other suffix only inherit-compound ones.

\*/

"use strict";

exports["compound-schema"] = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var schema = $tw.utils.getCompoundSchema(options.wiki,tiddler);
		if(schema && (!operator.suffix || (operator.suffix === "strict") === schema.strict)) {
			results.push(schema.title);
		}
	});
	return results;
};
