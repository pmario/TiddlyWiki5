/*\
title: test-compound-field-render.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the compound-field procedure and the presentation headers it reads:
type dispatch, write target, readonly-filter, hide-filter via :visible, and
the compound-field-meta suffix form.

\*/

/* eslint-env node, browser, jasmine */
"use strict";

describe("compound-field procedure and presentation headers", function() {

	var COMPOUND_TYPE = "text/vnd.tiddlywiki-multiple+fields";

	// The schema carries the presentation headers; Record follows it strictly, Loose loosely, Loner not at all.
	var templateText = [
		"title: email",
		"type: email",
		"label: E-Mail",
		"placeholder: name@example.com",
		"",
		"",
		"+",
		"title: secret",
		"hide-filter: [<currentTiddler>get[category]match[business]]",
		"",
		"",
		"+",
		"title: birthday",
		"type: date",
		"readonly-filter: [{!!category}match[business]]",
		"",
		""
	].join("\n");

	// The record's own headers on email are overruled by the schema; category is local only
	var recordText = [
		"title: email",
		"type: date",
		"label: Ignored",
		"",
		"jane@example.com",
		"+",
		"title: secret",
		"",
		"hidden value",
		"+",
		"title: birthday",
		"",
		"1990-06-15",
		"+",
		"title: category",
		"label: Kind",
		"",
		"business"
	].join("\n");

	function setupWiki() {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers([
			$tw.wiki.getTiddler("$:/core/macros/compound-field"),
			{title: "Template", type: COMPOUND_TYPE, text: templateText},
			{title: "Record", type: COMPOUND_TYPE, "inherit-schema": "Template", text: recordText},
			{title: "Loose", type: COMPOUND_TYPE, "inherit-compound": "Template", text: recordText},
			{title: "Loner", type: COMPOUND_TYPE, text: recordText},
			{title: "Draft of 'Record'", "draft.of": "Record", "draft.title": "Record", type: COMPOUND_TYPE, "inherit-schema": "Template", text: recordText},
			{title: "Plain", text: "plain tiddler", email: "plain@example.com"}
		]);
		wiki.addIndexersToWiki();
		return wiki;
	}

	// Renders wikitext with currentTiddler set to title, the way a view template sees it.
	// Browser equivalent: put the wikitext into a tiddler and open it, or use the preview.
	function render(wiki,title,wikitext) {
		var parser = wiki.parseText("text/vnd.tiddlywiki",
			"<$importvariables filter='[[$:/core/macros/compound-field]]'>" + wikitext + "</$importvariables>",
			{parseAsInline: true});
		var widgetNode = wiki.makeWidget(parser,{document: $tw.fakeDocument, variables: {currentTiddler: title}});
		var container = $tw.fakeDocument.createElement("div");
		widgetNode.render(container,null);
		return {html: container.innerHTML, widget: widgetNode};
	}

	function findWidget(widget,predicate) {
		if(predicate(widget)) {
			return widget;
		}
		for(var i = 0; i < widget.children.length; i++) {
			var found = findWidget(widget.children[i],predicate);
			if(found) {
				return found;
			}
		}
		return null;
	}

	it("compound-field-meta:prop<name> reads a header by suffix, from the schema", function() {
		var wiki = setupWiki();
		expect(wiki.filterTiddlers("[[Record]compound-field-meta:label[email]]")).toEqual(["E-Mail"]);
		expect(wiki.filterTiddlers("[[Record]compound-field-meta[email::label]]")).toEqual(["E-Mail"]);
		expect(wiki.filterTiddlers("[[Record]compound-field-meta:label[birthday]]")).toEqual([]);
	});

	it("compound-schema[] resolves inherit-schema and inherit-compound, with strict and loose suffixes", function() {
		var wiki = setupWiki();
		expect(wiki.filterTiddlers("[[Record]compound-schema[]]")).toEqual(["Template"]);
		expect(wiki.filterTiddlers("[[Loose]compound-schema[]]")).toEqual(["Template"]);
		expect(wiki.filterTiddlers("[[Record]compound-schema:strict[]]")).toEqual(["Template"]);
		expect(wiki.filterTiddlers("[[Loose]compound-schema:strict[]]")).toEqual([]);
		expect(wiki.filterTiddlers("[[Loose]compound-schema:loose[]]")).toEqual(["Template"]);
		expect(wiki.filterTiddlers("[[Loner]compound-schema[]]")).toEqual([]);
	});

	it("a strict schema owns the entries it defines; a loose one only fills gaps; a lone record keeps its own", function() {
		var wiki = setupWiki();
		// The draft is not materialized, so its own headers on email still exist and must be ignored
		expect(wiki.filterTiddlers("[[Draft of 'Record']compound-field-type[email]]")).toEqual(["email"]);
		expect(wiki.filterTiddlers("[[Draft of 'Record']compound-field-meta:label[email]]")).toEqual(["E-Mail"]);
		expect(wiki.filterTiddlers("[[Record]compound-field-meta:label[category]]")).toEqual(["Kind"]);
		expect(wiki.filterTiddlers("[[Loose]compound-field-type[email]]")).toEqual(["date"]);
		expect(wiki.filterTiddlers("[[Loose]compound-field-meta:label[email]]")).toEqual(["Ignored"]);
		expect(wiki.filterTiddlers("[[Loose]compound-field-meta:placeholder[email]]")).toEqual(["name@example.com"]);
		expect(wiki.filterTiddlers("[[Loner]compound-field-type[email]]")).toEqual(["date"]);
	});

	it("a strict schema's headers are written into the record on save; loose records and drafts are left alone", function() {
		var wiki = setupWiki();
		// Browser equivalent: give a record inherit-schema, save it, and read its text in the Fields tab
		expect(wiki.getTiddlerData("Record").email).toEqual({value: "jane@example.com", type: "email", label: "E-Mail", placeholder: "name@example.com"});
		expect(wiki.getTiddlerData("Record").category).toEqual({value: "business", label: "Kind"});
		expect(wiki.getTiddlerData("Loose").email).toEqual({value: "jane@example.com", type: "date", label: "Ignored"});
		expect(wiki.getTiddler("Draft of 'Record'").fields.text).toBe(recordText);
	});

	it("compound-field-names:visible drops an entry whose hide-filter matches the record", function() {
		var wiki = setupWiki();
		expect(wiki.filterTiddlers("[[Record]compound-field-names[]]")).toContain("secret");
		expect(wiki.filterTiddlers("[[Record]compound-field-names:visible[]]")).toEqual(["email","birthday","category"]);
		// A standard field write flips the condition; the hook keeps the compound text in sync
		wiki.addTiddler(new $tw.Tiddler(wiki.getTiddler("Record"),{category: "personal"}));
		expect(wiki.filterTiddlers("[[Record]compound-field-names:visible[]]")).toContain("secret");
	});

	it("view mode dispatches on the inherited type and the label honours the label header", function() {
		var wiki = setupWiki();
		var out = render(wiki,"Record",'<$transclude $variable="compound-field" fieldName="email"/>');
		expect(out.html).toContain('href="mailto:jane@example.com"');
		out = render(wiki,"Record",'<$transclude $variable="compound-field-label" fieldName="email"/>');
		expect(out.html).toBe("E-Mail");
		out = render(wiki,"Record",'<$transclude $variable="compound-field-label" fieldName="category"/>');
		expect(out.html).toBe("Kind");
		out = render(wiki,"Record",'<$transclude $variable="compound-field-label" fieldName="secret"/>');
		expect(out.html).toBe("secret");
	});

	it("edit mode writes a +fields entry by index, passes the placeholder, and readonly-filter forces view", function() {
		var wiki = setupWiki();
		var out = render(wiki,"Record",'<$transclude $variable="compound-field" fieldName="email" mode="edit"/>');
		expect(out.html).toContain('type="email"');
		expect(out.html).toContain('placeholder="name@example.com"');
		var editor = findWidget(out.widget,function(w) { return w.editTitle === "Record"; });
		expect(editor.editIndex).toBe("email");
		out = render(wiki,"Record",'<$transclude $variable="compound-field" fieldName="birthday" mode="edit"/>');
		expect(out.html).not.toContain("<input");
		expect(out.html).toContain("1990-06-15");
	});

	it("a standard tiddler takes the explicit type and writes the field, not an index", function() {
		var wiki = setupWiki();
		var out = render(wiki,"Plain",'<$transclude $variable="compound-field" fieldName="email" mode="edit" type="email"/>');
		expect(out.html).toContain('type="email"');
		var editor = findWidget(out.widget,function(w) { return w.editTitle === "Plain"; });
		expect(editor.editField).toBe("email");
		expect(editor.editIndex).toBeFalsy();
		out = render(wiki,"Plain",'<$transclude $variable="compound-field" fieldName="email"/>');
		expect(out.html).toBe("plain@example.com");
	});

});
