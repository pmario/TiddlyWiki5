/*\
title: test-global-cache.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the wiki globalCache. A cached value can declare the tiddler fields it
depends on via options.dependsOn. clearGlobalCache then drops that value only
when one of those fields changes, or when a tiddler carrying such a field is
added or deleted. A value with no declared dependencies is dropped on every
change, like before.

These specs double as runnable API examples. Open the F12 console of any wiki
and paste:

	var wiki = new $tw.Wiki(); // a throwaway sandbox, your real wiki is untouched
	wiki.addTiddler({title: "A", text: "a", tags: ["one"]});
	var builds = 0; // a plain counter so you can see when the value is rebuilt
	var build = function() { builds++; return {n: builds}; };
	wiki.getGlobalCache("demo", build, {dependsOn: ["tags"]}); // builds is now 1
	wiki.addTiddler(new $tw.Tiddler(wiki.getTiddler("A"), {text: "edited"}));
	wiki.getGlobalCache("demo", build, {dependsOn: ["tags"]}); // still 1: text is not a dependency
	wiki.addTiddler(new $tw.Tiddler(wiki.getTiddler("A"), {tags: ["one", "two"]}));
	wiki.getGlobalCache("demo", build, {dependsOn: ["tags"]}); // now 2: tags changed

\*/

"use strict";

describe("globalCache dependency invalidation", function() {

	// A small wiki with two tagged tiddlers and one that lists them.
	// In the console: var wiki = new $tw.Wiki(); wiki.addTiddler({title: "A", ...});
	function makeWiki() {
		var wiki = new $tw.Wiki();
		wiki.addTiddler({title: "A", text: "a", tags: ["one"]});
		wiki.addTiddler({title: "B", text: "b", tags: ["two"]});
		wiki.addTiddler({title: "C", text: "c", list: "A B"});
		return wiki;
	}

	// A counting initializer. This is not part of the TW API. It just lets a test,
	// or you in the console, see how many times getGlobalCache rebuilt the value.
	function counter() {
		var state = {builds: 0};
		state.init = function() {
			state.builds++;
			return {build: state.builds};
		};
		return state;
	}

	it("keeps the value when an unrelated field changes", function() {
		var wiki = makeWiki(), c = counter();
		// First read builds the value once.
		wiki.getGlobalCache("probe", c.init, {dependsOn: ["tags"]});
		expect(c.builds).toBe(1);
		// Editing only the text of tiddler A touches no dependency field.
		wiki.addTiddler(new $tw.Tiddler(wiki.getTiddler("A"), {text: "a changed"}));
		// So the next read is a cache hit and there is still one build.
		wiki.getGlobalCache("probe", c.init, {dependsOn: ["tags"]});
		expect(c.builds).toBe(1);
	});

	it("rebuilds the value when a dependency field changes", function() {
		var wiki = makeWiki(), c = counter();
		wiki.getGlobalCache("probe", c.init, {dependsOn: ["tags"]});
		// Changing the tags of A changes a declared dependency.
		wiki.addTiddler(new $tw.Tiddler(wiki.getTiddler("A"), {tags: ["one", "three"]}));
		// So the value is dropped and rebuilt: a second build.
		wiki.getGlobalCache("probe", c.init, {dependsOn: ["tags"]});
		expect(c.builds).toBe(2);
	});

	it("keeps the value when a tiddler without the dependency field is added then deleted", function() {
		var wiki = makeWiki(), c = counter();
		wiki.getGlobalCache("probe", c.init, {dependsOn: ["tags"]});
		// Z has no tags field, so adding then deleting it cannot affect a tags cache.
		wiki.addTiddler({title: "Z", text: "z"});
		wiki.deleteTiddler("Z");
		wiki.getGlobalCache("probe", c.init, {dependsOn: ["tags"]});
		expect(c.builds).toBe(1);
	});

	it("rebuilds the value when a tiddler carrying the dependency field is added", function() {
		var wiki = makeWiki(), c = counter();
		wiki.getGlobalCache("probe", c.init, {dependsOn: ["tags"]});
		// Y has a tags field, so adding it changes what a tags cache should contain.
		wiki.addTiddler({title: "Y", text: "y", tags: ["four"]});
		wiki.getGlobalCache("probe", c.init, {dependsOn: ["tags"]});
		expect(c.builds).toBe(2);
	});

	it("rebuilds a value that declares no dependencies on every change", function() {
		var wiki = makeWiki(), c = counter();
		// With no options.dependsOn the value is dropped on any tiddler change.
		wiki.getGlobalCache("probe", c.init);
		wiki.addTiddler(new $tw.Tiddler(wiki.getTiddler("A"), {text: "a changed"}));
		wiki.getGlobalCache("probe", c.init);
		expect(c.builds).toBe(2);
	});

	it("drops every entry on a full clearGlobalCache()", function() {
		var wiki = makeWiki(), c = counter();
		wiki.getGlobalCache("probe", c.init, {dependsOn: ["tags"]});
		// clearGlobalCache() with no argument wipes everything, dependencies and all.
		wiki.clearGlobalCache();
		wiki.getGlobalCache("probe", c.init, {dependsOn: ["tags"]});
		expect(c.builds).toBe(2);
	});

	it("getTagMap is a real consumer: it survives a text edit but rebuilds on a tags change", function() {
		var wiki = makeWiki();
		// getTagMap() returns a cached map. Example: {one: ["A"], two: ["B"]}
		var map1 = wiki.getTagMap();
		// A text edit is not a tags change, so the very same object comes back.
		wiki.addTiddler(new $tw.Tiddler(wiki.getTiddler("A"), {text: "a changed"}));
		expect(wiki.getTagMap()).toBe(map1); // the identical reference, in the console too
		// A tags change rebuilds it, and the new tag shows up.
		wiki.addTiddler(new $tw.Tiddler(wiki.getTiddler("A"), {tags: ["one", "fresh"]}));
		var map2 = wiki.getTagMap();
		expect(map2).not.toBe(map1);
		expect(Object.keys(map2)).toContain("fresh");
	});

});
