/*\
title: test-paragraph-widget.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the paragraph widget, which decides at render time whether a block run keeps the
paragraph the parser proposed.

Two classes of defect are guarded here, and neither was reachable by the rest of the suite.

The first is refresh. Every other spec renders once, but the widget has to retake its
decision whenever a child changes, and moving DOM after rendering leaves stale references
behind. Three bugs of this class shipped and were found by hand: a sidebar search dropdown
that silently stopped opening because descendants still pointed at the discarded paragraph,
a $reveal that doubled the buttons above it on every show/hide because the re-render
condition was inverted, and text that lost its paragraph because a cached node list went
stale. So every spec here refreshes at least three times and asserts the counts come back.

The second is markup validity. A paragraph containing a block element is markup no browser
will build, so the interactive DOM and any static render of the same source disagree. The
corpus check at the end asserts that never happens, rather than trusting each expectation
string to have been written correctly.

\*/

"use strict";

describe("Paragraph widget", function() {

	var widget = require("$:/core/modules/widgets/widget.js");

	function render(text,wiki) {
		var parser = wiki.parseText("text/vnd.tiddlywiki",text,{parseAsInline: false}),
			widgetNode = new widget.widget({type: "widget", children: parser.tree},{
				wiki: wiki,
				document: $tw.fakeDocument
			}),
			wrapper = $tw.fakeDocument.createElement("div");
		$tw.fakeDocument.setSequenceNumber(0);
		widgetNode.render(wrapper,null);
		return {widgetNode: widgetNode, wrapper: wrapper};
	}

	function refresh(rendered,changedTitles) {
		var changedTiddlers = {};
		$tw.utils.each(changedTitles,function(title) {
			changedTiddlers[title] = true;
		});
		rendered.widgetNode.refresh(changedTiddlers,rendered.wrapper,null);
	}

	function count(wrapper,tagName) {
		var total = 0;
		(function walk(node) {
			$tw.utils.each(node.childNodes || [],function(child) {
				if(child.nodeType === 1) {
					if((child.tagName || "").toLowerCase() === tagName) {
						total++;
					}
					walk(child);
				}
			});
		})(wrapper);
		return total;
	}

	it("should re-render only when its decision actually changes", function() {
		// Guards the shipped bug where clicking show/hide/show on a $reveal doubled the
		// buttons above it, 2 to 4 to 6 to 8. The cause was a refresh condition that
		// rebuilt the run on every refresh rather than only when the wrap decision flipped.
		// Counting elements does not detect it, because rebuilding cleans up after itself.
		// Node IDENTITY does: a paragraph that survives a refresh must be the same node
		var wiki = $tw.test.wiki();
		wiki.addTiddler({title: "Content", text: "words"});
		wiki.addTiddler({title: "Unrelated", text: "x"});
		var rendered = render("lead <$transclude tiddler=\"Content\" mode=\"inline\"/> tail\n",wiki),
			paragraph = rendered.wrapper.firstChild;
		expect((paragraph.tagName || "").toLowerCase()).toBe("p");
		for(var pass=0; pass<3; pass++) {
			// The decision cannot change, so the very same DOM node must still be there
			wiki.addTiddler({title: "Content", text: "words " + pass});
			refresh(rendered,["Content"]);
			expect(rendered.wrapper.firstChild).toBe(paragraph);
			refresh(rendered,["Unrelated"]);
			expect(rendered.wrapper.firstChild).toBe(paragraph);
		}
	});

	it("should keep rendering into the live DOM after the paragraph is discarded", function() {
		// Guards the shipped bug where the sidebar search dropdown silently stopped
		// opening, with no error. A descendant rendered straight into the paragraph and
		// cached it as its parent node; a pass-through such as $let puts that node
		// arbitrarily deep. Once the run turned out to be block the paragraph was thrown
		// away, and the next refresh rendered into the discarded node, so nothing appeared.
		// The run must UNWRAP for this to bite, which is why Content starts as a block
		var wiki = $tw.test.wiki();
		wiki.addTiddler({title: "Content", text: "<div>first</div>"});
		var rendered = render("lead <$let unused=\"1\"><$transclude tiddler=\"Content\" mode=\"inline\"/></$let> tail\n",wiki);
		expect(rendered.wrapper.textContent).toContain("first");
		for(var pass=0; pass<3; pass++) {
			wiki.addTiddler({title: "Content", text: "<div>updated" + pass + "</div>"});
			refresh(rendered,["Content"]);
			expect(rendered.wrapper.textContent).toContain("updated" + pass);
		}
	});

	it("should retake its decision when content changes between inline and block", function() {
		// The decision depends on what the children rendered, so it has to be retaken when
		// they change. A run that turns out to hold a block must be split the way a browser
		// splits it, and must go back to one paragraph when the block goes away, repeatedly
		// and without leaving orphaned nodes behind.
		// Text either side of the transclusion is what puts this in a paragraph run at all:
		// a self closing tag followed by end of source passes the html block gate instead
		var wiki = $tw.test.wiki();
		wiki.addTiddler({title: "Content", text: "words"});
		var rendered = render("lead <$transclude tiddler=\"Content\" mode=\"inline\"/> tail\n",wiki);
		expect(count(rendered.wrapper,"p")).toBe(1);
		expect(count(rendered.wrapper,"div")).toBe(0);
		for(var pass=0; pass<3; pass++) {
			wiki.addTiddler({title: "Content", text: "<div>block</div>"});
			refresh(rendered,["Content"]);
			expect(count(rendered.wrapper,"div")).toBe(1);
			expect(count(rendered.wrapper,"p")).toBe(2);
			expect(rendered.wrapper.textContent).toContain("lead");
			expect(rendered.wrapper.textContent).toContain("tail");
			wiki.addTiddler({title: "Content", text: "words"});
			refresh(rendered,["Content"]);
			expect(count(rendered.wrapper,"p")).toBe(1);
			expect(count(rendered.wrapper,"div")).toBe(0);
		}
	});

	it("should carry a styleblock's class onto whatever replaces the paragraph", function() {
		// A styleblock decorates the paragraph the parser produced, so once that paragraph
		// is gone the author's class has to travel to what replaced it. Without this
		// @@.myClass around a block silently loses its styling
		var wiki = $tw.test.wiki();
		var overText = render("@@.myClass\njust text\n@@\n",wiki),
			overBlock = render("@@.myClass\n<div>block</div>\n@@\n",wiki);
		expect(overText.wrapper.innerHTML).toContain("class=\"myClass\"");
		expect(overBlock.wrapper.innerHTML).toContain("class=\"myClass\"");
	});

	it("should not wrap a run whose only content is metadata", function() {
		// A <style> element draws nothing wherever it sits, so a run holding only metadata
		// has not earned a paragraph. Anything else counts even when it looks empty,
		// because an attribute alone can give an element a box
		var wiki = $tw.test.wiki();
		expect(count(render("<style>.x { color: red; }</style>\n",wiki).wrapper,"p")).toBe(0);
		expect(count(render("<span style=\"width:1em;background-color:red\"></span>\n",wiki).wrapper,"p")).toBe(1);
	});

	it("should not create a paragraph for a run that renders nothing", function() {
		// An author may still write <p/> and get an empty paragraph, which is honoured
		// rather than deleted, so this is about what the widget itself produces
		var wiki = $tw.test.wiki();
		wiki.addTiddler({title: "Content", text: ""});
		expect(count(render("<$transclude tiddler=\"Content\" mode=\"inline\"/>\n",wiki).wrapper,"p")).toBe(0);
		expect(count(render("<$list filter=\"[[nothing-matches-this]is[system]]\"/>\n",wiki).wrapper,"p")).toBe(0);
	});

	it("should never render a paragraph holding a block element", function() {
		// A paragraph containing a block element is markup no browser will build, so a
		// static render of the same source disagrees with the interactive DOM. Asserted
		// over the whole wiki-test-spec corpus rather than trusting each expectation string
		// to have been written correctly, which is how 75 of these went unnoticed
		var closing = $tw.config.htmlParagraphClosingElements,
			offenders = [];
		$tw.utils.each($tw.wiki.filterTiddlers("[all[tiddlers+shadows]type[text/vnd.tiddlywiki-multiple]tag[$:/tags/wiki-test-spec]]"),function(title) {
			var expected = readSubTiddler(title,"ExpectedResult");
			if(expected === null) {
				return;
			}
			var match, paragraph = /<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g;
			while((match = paragraph.exec(expected)) !== null) {
				var body = match[1];
				$tw.utils.each(closing,function(tag) {
					if(new RegExp("<" + tag + "[\\s>/]").test(body)) {
						offenders.push(title + ": paragraph contains <" + tag + ">");
					}
				});
			}
		});
		expect(offenders).toEqual([]);
	});

	// The corpus tiddlers are text/vnd.tiddlywiki-multiple, so the sub tiddler has to be
	// split out of the raw text the same way the wiki-based test runner does it
	function readSubTiddler(title,subTitle) {
		var blocks = ($tw.wiki.getTiddlerText(title) || "").split(/\r?\n\+\r?\n/mg),
			found = null;
		$tw.utils.each(blocks,function(block) {
			var split = block.indexOf("\n\n"),
				header = split === -1 ? block : block.substring(0,split),
				body = split === -1 ? "" : block.substring(split + 2);
			if(new RegExp("^title:\\s*" + $tw.utils.escapeRegExp(subTitle) + "\\s*$","m").test(header)) {
				found = body;
			}
		});
		return found;
	}

});
