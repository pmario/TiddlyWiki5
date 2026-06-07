/*\
title: test-global-cache-perf.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Performance benchmark for the wiki globalCache (archived measurement code).

clearGlobalCache() runs unconditionally on every addTiddler/deleteTiddler, so
every keystroke or UI interaction that writes a tiddler wipes the whole cache.
The next filter that uses it then pays a full O(store) rebuild, even when the
write could not have affected the cached data (e.g. typing in a tiddler body
does not change any `tags` or `list` field).

Consumers measured:
- tagmap: built by getTagMap(), used by the [tags[]] and [is[tag]] operators
- listings: built by findListingsOfTiddler(), used by the [listed[]] operator

For each it reports:
- rebuild: cost of one cold rebuild (what every write makes the next read pay)
- hit: cost of a warm cache read (what it would cost if not cleared)

Runs as part of the test edition (npm test); skipped in CI/CD.

\*/

"use strict";

describe("globalCache rebuild performance [benchmark]", function() {

	// See performance/readme.md for the CI/CD and version-archive gate.
	var ARCHIVED_FROM = "5.5.0";
	var env = (typeof process !== "undefined" && process.env) || {};
	var skipReason = null;
	if(env.CI || env.NETLIFY || env.TW_SKIP_PERF_TESTS) {
		skipReason = "skipped in CI/CD";
	} else if($tw.utils.checkVersions($tw.version,ARCHIVED_FROM)) {
		skipReason = "archived from v" + ARCHIVED_FROM;
	}
	if(skipReason) {
		it("benchmark not run here (" + skipReason + ")",function() {
			pending(skipReason + "; running core is v" + $tw.version);
		});
		return;
	}

	// ~current, +20k, +40k
	var SIZES = [1000, 20000, 40000];
	// samples to average each measurement over
	var SAMPLES = 20;
	// spread of distinct tags
	var DISTINCT_TAGS = 200;
	// 1 in 7 tiddlers carries a list field
	var LIST_EVERY = 7;

	function buildWiki(size) {
		var wiki = new $tw.Wiki();
		for(var i=0; i<size; i++) {
			var fields = {title: "t" + i, text: "body " + i, tags: ["tag" + (i % DISTINCT_TAGS)]};
			if(i % LIST_EVERY === 0) {
				fields.list = "t" + ((i + 1) % size) + " t" + ((i + 2) % size) + " t" + ((i + 3) % size);
			}
			wiki.addTiddler(fields);
		}
		return wiki;
	}

	function avg(fn) {
		var t0 = $tw.utils.timer();
		for(var i=0; i<SAMPLES; i++) {
			fn();
		}
		return $tw.utils.timer(t0) / SAMPLES;
	}

	function measure(size) {
		var wiki = buildWiki(size);

		// tagmap: cold rebuild (clear then build) vs warm hit
		var tagmapRebuild = avg(function() {
			wiki.clearGlobalCache();
			wiki.getTagMap();
		});
		wiki.getTagMap();
		var tagmapHit = avg(function() {
			wiki.getTagMap();
		});

		// listings: cold rebuild vs warm hit
		var listingsRebuild = avg(function() {
			wiki.clearGlobalCache();
			wiki.findListingsOfTiddler("t1", "list");
		});
		wiki.findListingsOfTiddler("t1", "list");
		var listingsHit = avg(function() {
			wiki.findListingsOfTiddler("t1", "list");
		});

		// Real per-keystroke cost: edit a tiddler body (clears the cache via
		// addTiddler) then read the tagmap, as an on-screen [tags[]] widget would
		var editThenRead = avg(function() {
			wiki.addTiddler(new $tw.Tiddler(wiki.getTiddler("t0"), {text: "edit"}));
			wiki.getTagMap();
		});

		console.log(
			"[gcache] size=" + pad(size, 6) +
			" tagmapRebuild=" + pad(tagmapRebuild.toFixed(3), 8) + "ms" +
			" tagmapHit=" + pad(tagmapHit.toFixed(4), 8) + "ms" +
			" listingsRebuild=" + pad(listingsRebuild.toFixed(3), 8) + "ms" +
			" listingsHit=" + pad(listingsHit.toFixed(4), 8) + "ms" +
			" editThenRead=" + pad(editThenRead.toFixed(3), 8) + "ms"
		);
	}

	function pad(value, width) {
		var s = "" + value;
		while(s.length < width) {
			s = " " + s;
		}
		return s;
	}

	SIZES.forEach(function(size) {
		it("measures globalCache rebuild cost at " + size + " tiddlers", function() {
			measure(size);
		});
	});

});
