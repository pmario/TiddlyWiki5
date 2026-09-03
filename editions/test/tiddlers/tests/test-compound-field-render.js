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

	// The template carries the presentation headers; the record inherits them.
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

	var recordText = [
		"title: email",
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
		"",
		"business"
	].join("\n");

	function setupWiki() {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers([
			$tw.wiki.getTiddler("$:/core/macros/compound-field"),
			{title: "Template", type: COMPOUND_TYPE, text: templateText},
			{title: "Record", type: COMPOUND_TYPE, "inherit-compound": "Template", text: recordText},
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

	it("compound-field-meta:prop<name> reads a header by suffix, template fallback included", function() {
		var wiki = setupWiki();
		expect(wiki.filterTiddlers("[[Record]compound-field-meta:label[email]]")).toEqual(["E-Mail"]);
		expect(wiki.filterTiddlers("[[Record]compound-field-meta[email::label]]")).toEqual(["E-Mail"]);
		expect(wiki.filterTiddlers("[[Record]compound-field-meta:label[birthday]]")).toEqual([]);
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
		expect(out.html).toBe("category");
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
