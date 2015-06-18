/*\
title: test-iframe-responsive-macro.js
type: application/javascript
tags: [[$:/tags/test-spec]]

This tests the javascript macro <<iframe-responsive>>. Nothing else.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false, describe: false, it: false, expect: false */
"use strict";

describe("Macro iframe-responsive tests", function() {

	// Create a wiki
	var wiki = new $tw.Wiki();
	var ot = "text/html";
	var tt = "text/vnd-tiddlywiki";
	
	// The template tiddler
	wiki.addTiddler({title: "$:/macros/iframe-responsive/template", text: '<div  class="$class$" style="width: 100%; padding-bottom: $ratio$%; height: 0px; position: relative;"><iframe style="width: 100%; height: 100%; position: absolute; left: 0px; top: 0px;" src="$src$" frameborder="$frameborder$" $allowfullscreen$></iframe></div>'});

	// the test macro calls
	// copy paste this one as a template.
/*
	wiki.addTiddler({title: "42", text: '42'});
	it("should make the ultimate renderTiddler() test 42=42", function() {
		expect(wiki.renderTiddler("text/html","42"))
			.toBe('<p>42</p>');
	});

	it("should make the ultimate renderText() test 42=42", function() {
		expect(wiki.renderText(ot, tt,'42'))
			.toBe('<p>42</p>');
	});
*/

	it("should render html with js macro DefaultSettings", function() {
		expect(wiki.renderText(ot, tt,'<<iframe-responsive src:"http://example.com/embed/asdf" >>'))
			.toBe('<p><div class="" style="width: 100%; padding-bottom: 56.25%; height: 0px; position: relative;"><iframe allowfullscreen="true" frameborder="0" src="http://example.com/embed/asdf" style="width: 100%; height: 100%; position: absolute; left: 0px; top: 0px;"></iframe></div></p>');
	});

	it("should render the macro in debug CODE mode", function() {
		expect(wiki.renderText(ot, tt,'<<iframe-responsive src:"http://example.com/embed/asdf" debug:CoDe>>'))
			.toBe('<pre><code>&lt;div  class=&quot;&quot; style=&quot;width: 100%; padding-bottom: 56.25%; height: 0px; position: relative;&quot;&gt;&lt;iframe style=&quot;width: 100%; height: 100%; position: absolute; left: 0px; top: 0px;&quot; src=&quot;http://example.com/embed/asdf&quot; frameborder=&quot;0&quot; allowfullscreen&gt;&lt;/iframe&gt;&lt;/div&gt;</code></pre>');
	});

	it("should render the macro in debug HTML mode", function() {
		expect(wiki.renderText(ot, tt,'<<iframe-responsive src:"http://example.com/embed/asdf" debug:HtMl>>'))
			.toBe('<pre>&lt;p&gt;&lt;div class=&quot;&quot; style=&quot;width: 100%; padding-bottom: 56.25%; height: 0px; position: relative;&quot;&gt;&lt;iframe allowfullscreen=&quot;true&quot; frameborder=&quot;0&quot; src=&quot;http://example.com/embed/asdf&quot; style=&quot;width: 100%; height: 100%; position: absolute; left: 0px; top: 0px;&quot;&gt;&lt;/iframe&gt;&lt;/div&gt;&lt;/p&gt;</pre>');
	});

	it("should add a class attribute", function() {
		expect(wiki.renderText(ot, tt,'<<iframe-responsive src:"http://example.com/embed/asdf" class:"test-class">>'))
			.toBe('<p><div class="test-class" style="width: 100%; padding-bottom: 56.25%; height: 0px; position: relative;"><iframe allowfullscreen="true" frameborder="0" src="http://example.com/embed/asdf" style="width: 100%; height: 100%; position: absolute; left: 0px; top: 0px;"></iframe></div></p>');
	});

	it("should set ratio attribute to 75% aka 4:3", function() {
		expect(wiki.renderText(ot, tt,'<<iframe-responsive src:"http://example.com/embed/asdf" ratio:"4:3">>'))
			.toBe('<p><div class="" style="width: 100%; padding-bottom: 75%; height: 0px; position: relative;"><iframe allowfullscreen="true" frameborder="0" src="http://example.com/embed/asdf" style="width: 100%; height: 100%; position: absolute; left: 0px; top: 0px;"></iframe></div></p>');
	});

	it("should set ratio attribute to 60%", function() {
		expect(wiki.renderText(ot, tt,'<<iframe-responsive src:"http://example.com/embed/asdf" ratio:"60">>'))
			.toBe('<p><div class="" style="width: 100%; padding-bottom: 60%; height: 0px; position: relative;"><iframe allowfullscreen="true" frameborder="0" src="http://example.com/embed/asdf" style="width: 100%; height: 100%; position: absolute; left: 0px; top: 0px;"></iframe></div></p>');
	});

	it("should set ratio attribute to 60%. Remove % sign from the prameter, since it is added by the template", function() {
		expect(wiki.renderText(ot, tt,'<<iframe-responsive src:"http://example.com/embed/asdf" ratio:"60%">>'))
			.toBe('<p><div class="" style="width: 100%; padding-bottom: 60%; height: 0px; position: relative;"><iframe allowfullscreen="true" frameborder="0" src="http://example.com/embed/asdf" style="width: 100%; height: 100%; position: absolute; left: 0px; top: 0px;"></iframe></div></p>');
	});

	it("should set ratio attribute to 60%. Remove several % sign from the prameter", function() {
		expect(wiki.renderText(ot, tt,'<<iframe-responsive src:"http://example.com/embed/asdf" ratio:"60%%%">>'))
			.toBe('<p><div class="" style="width: 100%; padding-bottom: 60%; height: 0px; position: relative;"><iframe allowfullscreen="true" frameborder="0" src="http://example.com/embed/asdf" style="width: 100%; height: 100%; position: absolute; left: 0px; top: 0px;"></iframe></div></p>');
	});

	it("should ignore width parameter and use ratio instead", function() {
		expect(wiki.renderText(ot, tt,'<<iframe-responsive src:"http://example.com/embed/asdf" ratio:"4:3" width:"500">>'))
			.toBe('<p><div class="" style="width: 100%; padding-bottom: 75%; height: 0px; position: relative;"><iframe allowfullscreen="true" frameborder="0" src="http://example.com/embed/asdf" style="width: 100%; height: 100%; position: absolute; left: 0px; top: 0px;"></iframe></div></p>');
	});

	it("should ignore height parameter and use ratio instead", function() {
		expect(wiki.renderText(ot, tt,'<<iframe-responsive src:"http://example.com/embed/asdf" ratio:"4:3" height:"200">>'))
			.toBe('<p><div class="" style="width: 100%; padding-bottom: 75%; height: 0px; position: relative;"><iframe allowfullscreen="true" frameborder="0" src="http://example.com/embed/asdf" style="width: 100%; height: 100%; position: absolute; left: 0px; top: 0px;"></iframe></div></p>');
	});

	it("should use width and height parameter and ignore ratio", function() {
		expect(wiki.renderText(ot, tt,'<<iframe-responsive src:"http://example.com/embed/asdf" ratio:"4:3" width:"500" height:"200">>'))
			.toBe('<p><div class="" style="width: 100%; padding-bottom: 40%; height: 0px; position: relative;"><iframe allowfullscreen="true" frameborder="0" src="http://example.com/embed/asdf" style="width: 100%; height: 100%; position: absolute; left: 0px; top: 0px;"></iframe></div></p>');
	});

	it("should use width and height to calculate the ratio", function() {
		expect(wiki.renderText(ot, tt,'<<iframe-responsive src:"http://example.com/embed/asdf" width:"500" height:"210">>'))
			.toBe('<p><div class="" style="width: 100%; padding-bottom: 42%; height: 0px; position: relative;"><iframe allowfullscreen="true" frameborder="0" src="http://example.com/embed/asdf" style="width: 100%; height: 100%; position: absolute; left: 0px; top: 0px;"></iframe></div></p>');
	});

	it("should set frameborder to 1", function() {
		expect(wiki.renderText(ot, tt,'<<iframe-responsive src:"http://example.com/embed/asdf" ratio:"4:3" frameborder:1>>'))
			.toBe('<p><div class="" style="width: 100%; padding-bottom: 75%; height: 0px; position: relative;"><iframe allowfullscreen="true" frameborder="1" src="http://example.com/embed/asdf" style="width: 100%; height: 100%; position: absolute; left: 0px; top: 0px;"></iframe></div></p>');
	});

	it("should replace the attribute allowfullscreen with the attribute no ", function() {
		expect(wiki.renderText(ot, tt,'<<iframe-responsive src:"http://example.com/embed/asdf" allowfullscreen:no >>'))
			.toBe('<p><div class="" style="width: 100%; padding-bottom: 56.25%; height: 0px; position: relative;"><iframe frameborder="0" no="true" src="http://example.com/embed/asdf" style="width: 100%; height: 100%; position: absolute; left: 0px; top: 0px;"></iframe></div></p>');
	});

	it("should replace allowfullscreen with several parameters", function() {
		expect(wiki.renderText(ot, tt,'<<iframe-responsive src:"http://example.com/embed/asdf" allowfullscreen:"several atributes without values">>'))
					 .toBe('<p><div class="" style="width: 100%; padding-bottom: 56.25%; height: 0px; position: relative;"><iframe atributes="true" frameborder="0" several="true" src="http://example.com/embed/asdf" style="width: 100%; height: 100%; position: absolute; left: 0px; top: 0px;" values="true" without="true"></iframe></div></p>');
	});

});

})();
