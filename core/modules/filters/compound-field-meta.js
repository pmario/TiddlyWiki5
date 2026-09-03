/*\
title: $:/core/modules/filters/compound-field-meta.js
type: application/javascript
module-type: filteroperator

Returns a metadata header of a sub-entry in a compound tiddler.
Operand format: fieldName::propertyName (e.g. "role::roles"), or the property as
suffix with the field name as operand: compound-field-meta:roles<fieldName>
A strict schema (inherit-schema) owns the entries it defines; a loose one
(inherit-compound) only fills in what the tiddler lacks.

\*/

"use strict";

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
		var value = $tw.utils.getCompoundFieldMeta(options.wiki,tiddler,fieldName,propertyName);
		if(value !== null) {
			results.push(value);
		}
	});
	return results;
};
