/*\
title: $:/core/modules/macros/iframe-responsive.js
type: application/javascript
module-type: macro

This macro makes an iframe responsive. It either directly uses the ratio parameter or the hight and width parameters to calculate the aspect ratio. If hight and width are defined, they take precedence over the ratio parameter.

!! Examples

<<iframe-responsive src:"http://example.com/embed/asdf" debug:code>>
<<iframe-responsive src:"http://example.com/embed/asdf" debug:html>>

<<iframe-responsive src:"http://example.com/embed/asdf" class:"test-class" debug:html>>

<<iframe-responsive src:"http://example.com/embed/asdf" ratio:"4:3" debug:html>>

<<iframe-responsive src:"http://example.com/embed/asdf" ratio:"60" debug:html>>

<<iframe-responsive src:"http://example.com/embed/asdf" ratio:"60%" debug:html>>

<<iframe-responsive src:"http://example.com/embed/asdf" ratio:"60%%%" debug:html>>

<<iframe-responsive src:"http://example.com/embed/asdf" ratio:"4:3" width:"500" debug:html>>

<<iframe-responsive src:"http://example.com/embed/asdf" ratio:"4:3" height:"200" debug:html>>

<<iframe-responsive src:"http://example.com/embed/asdf" ratio:"4:3" width:"500" height:"200" debug:html>>

<<iframe-responsive src:"http://example.com/embed/asdf" width:"500" height:"210" debug:html>>

<<iframe-responsive src:"http://example.com/embed/asdf" ratio:"4:3" frameborder:1 debug:html>>

<<iframe-responsive src:"http://example.com/embed/asdf" allowfullscreen:no debug:html>>

<<iframe-responsive src:"http://example.com/embed/asdf" allowfullscreen:"several atributes without values" debug:html>>

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
console.log(this);
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
