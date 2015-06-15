/*\
title: $:/core/modules/macros/iframe-responsive.js
type: application/javascript
module-type: macro

xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx description

\define iframe-responsive(src; ratio:"56.25%"; allowfullscreen:"allowfullscreen"; frameborder:"0")
<div style="width: 100%; padding-bottom: $ratio$; height: 0px; position: relative;"><iframe style="width: 100%; height: 100%; position: absolute; left: 0px; top: 0px;" src="$src$" frameborder="$frameborder$" $allowfullscreen$></iframe></div>
\end


\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "iframe-responsive";

exports.params = [
	{"name":"src", "default":""},
	{"name":"ratio", "default":"56.25"},
	{"name":"width"},
	{"name":"height"},
	{"name":"allowfullscreen", "default":"allowfullscreen"},
	{"name":"frameborder", "default":"0"},
	{"name":"class", "default":""},
	{"name":"debug"}
	];

/*
Run the macro
*/
exports.run = function(src, ratio, width, height, allowfullscreen, frameborder, cssClass, debug) {
	var template = this.wiki.getTiddlerText("$:/macros/iframe-responsive/template");

	// remove % character, if there is one. It is defined in the template.
	ratio = ratio.replace(/%/g,"");
	
	// if ratio is defined as eg: 16:9 .. calculate it
	if (ratio.indexOf(":") != -1) {
		ratio = (ratio.split(":")[1] / ratio.split(":")[0]) * 100.0;
	}

	// if width and height are defined, ratio can be calculated and take precedence.
	if (width && height) {
		ratio = (height / width) * 100.0;
	}

	template = template.replace(/\$src\$/g, src).
					replace(/\$ratio\$/g, ratio).
					replace(/\$allowfullscreen\$/g, allowfullscreen).
					replace(/\$class\$/g, cssClass).
					replace(/\$frameborder\$/g, frameborder);

	// instead of rendering print the syntax, that should be executed
	switch (debug.toLowerCase()) {
		case "html":
			template = "$$$text/vnd.tiddlywiki>text/html\n" + template + "\n$$$";
			break;
		case "code":
			template = "```\n" + template + "\n```";
			break;
	}

	return template;
};

})();
