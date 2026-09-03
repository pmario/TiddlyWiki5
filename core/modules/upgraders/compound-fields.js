/*\
title: $:/core/modules/upgraders/compound-fields.js
type: application/javascript
module-type: upgrader

Flags an incoming +fields tiddler whose derived fields disagree with its compound
text, so the import dialog says which side the addTiddler hook will keep.

\*/

"use strict";

var COMPOUND_TYPE = "text/vnd.tiddlywiki-multiple+fields";
var RESERVED = {"title":true,"text":true,"type":true,"created":true,"creator":true,"modified":true,"modifier":true,"tags":true,"bag":true,"revision":true};

function differingFields(fields) {
	var parsed = $tw.utils.parseMultilineFields(fields.text),
		names = [];
	for(var name in parsed) {
		if(name !== "text" && RESERVED[name]) {
			continue;
		}
		var target = name === "text" ? "body" : name,
			entry = parsed[name],
			value = (entry !== null && typeof entry === "object" && $tw.utils.hop(entry,"value")) ? entry.value : entry;
		if(fields[target] !== undefined && ("" + fields[target]) !== ("" + value)) {
			names.push(target);
		}
	}
	return names;
}

exports.upgrade = function(wiki,titles,tiddlers) {
	var messages = {};
	$tw.utils.each(titles,function(title) {
		var fields = tiddlers[title];
		if(fields && fields.type === COMPOUND_TYPE && fields.text) {
			var names = differingFields(fields);
			if(names.length) {
				// Mirrors the hook: an unchanged local text lets the field values win, otherwise the text does
				var existing = wiki.getTiddler(title),
					fieldsWin = existing && existing.fields.type === COMPOUND_TYPE && existing.fields.text === fields.text;
				messages[title] = $tw.language.getString(
					fieldsWin ? "Import/Upgrader/CompoundFields/FieldsWin" : "Import/Upgrader/CompoundFields/TextWins",
					{variables: {fields: names.join(", ")}}
				);
			}
		}
	});
	return messages;
};
