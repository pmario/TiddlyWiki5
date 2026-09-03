/*\
title: test-compound-field-import.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the import upgrader for +fields tiddlers whose derived fields disagree
with their compound text, and the outcome each message announces.

\*/

/* eslint-env node, browser, jasmine */
"use strict";

describe("Compound +fields import upgrader", function() {

	var COMPOUND_TYPE = "text/vnd.tiddlywiki-multiple+fields";
	var text = "title: email\ntype: email\n\nold@example.com";

	// An export carries the compound text and every derived field; here the field was edited elsewhere
	function incoming(email) {
		return {title: "Target", type: COMPOUND_TYPE, text: text, email: email};
	}

	function message(name) {
		return $tw.language.getString("Import/Upgrader/CompoundFields/" + name,{variables: {fields: "email"}});
	}

	// Browser equivalent: export a +fields tiddler as JSON, change a field in a wiki without
	// this feature, drag the file back in and read the message beside the tiddler in the import dialog.
	it("flags a fresh import whose field differs; the text value is kept", function() {
		var wiki = new $tw.Wiki();
		var tiddlers = {Target: incoming("new@example.com")};
		expect(wiki.invokeUpgraders(["Target"],tiddlers).Target).toBe(message("TextWins"));
		wiki.addTiddler(tiddlers.Target);
		expect(wiki.getTiddler("Target").fields.email).toBe("old@example.com");
	});

	it("flags a re-import over an unchanged local text; the field value is written into it", function() {
		var wiki = new $tw.Wiki();
		wiki.addTiddler({title: "Target", type: COMPOUND_TYPE, text: text});
		var tiddlers = {Target: incoming("new@example.com")};
		expect(wiki.invokeUpgraders(["Target"],tiddlers).Target).toBe(message("FieldsWin"));
		wiki.addTiddler(tiddlers.Target);
		expect(wiki.getTiddler("Target").fields.text).toContain("new@example.com");
	});

	it("stays silent when fields and text agree", function() {
		var wiki = new $tw.Wiki();
		expect(wiki.invokeUpgraders(["Target"],{Target: incoming("old@example.com")}).Target).toBeUndefined();
	});

});
