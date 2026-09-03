/*\
title: $:/core/modules/filters/compound-field-meta.js
type: application/javascript
module-type: filteroperator

Returns a metadata property of a sub-entry in a compound tiddler.
Operand format: fieldName::propertyName (e.g. "role::roles"), or the property as
suffix with the field name as operand: compound-field-meta:roles<fieldName>
Falls back to the inherit-compound template if the tiddler doesn't define it.

\*/

"use strict";

function getEntryMeta(wiki,tiddler,fieldName,propertyName) {
	var data = wiki.getTiddlerData(tiddler);
	if(data && $tw.utils.hop(data,fieldName)) {
		var entry = data[fieldName];
		if(entry !== null && typeof entry === "object" && $tw.utils.hop(entry,propertyName)) {
			return entry[propertyName];
		}
	}
	return null;
}

exports["compound-field-meta"] = function(source,operator,options) {
	var results = [];
	var fieldName, propertyName;
	// The suffix form keeps the property literal so the field name can come from a variable
	if(operator.suffix) {
		fieldName = operator.operand;
		propertyName = operator.suffix;
	} else {
		var parts = (operator.operand || "").split("::");
		fieldName = parts[0];
		propertyName = parts[1];
	}
	if(!fieldName || !propertyName) {
		return results;
	}
	source(function(tiddler,title) {
		if(tiddler && (tiddler.fields.type === "text/vnd.tiddlywiki-multiple" ||
			tiddler.fields.type === "text/vnd.tiddlywiki-multiple+fields")) {
			var value = getEntryMeta(options.wiki,tiddler,fieldName,propertyName);
			// Fall back to template
			if(value === null && tiddler.fields["inherit-compound"]) {
				var templateTiddler = options.wiki.getTiddler(tiddler.fields["inherit-compound"]);
				if(templateTiddler) {
					value = getEntryMeta(options.wiki,templateTiddler,fieldName,propertyName);
				}
			}
			if(value !== null) {
				results.push(value);
			}
		}
	});
	return results;
};
