/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/hard-breaks.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertNodes;

function horizontalRule() {
	return {
		type: "element",
		tag: "hr",
		rule: "horizrule"
	};
}

function hardBreak() {
	return {
		type: "element",
		tag: "br"
	};
}

function hardLineBreaksBlock(builders, node) {
	const children = convertNodes(builders, node.content || []);
	// The parser shape: a void wrapper carrying the rule name, where only the
	// br nodes of the region share it so the serializer writes their line ends
	children.forEach((child) => {
		if(child.type === "element" && child.tag === "br") {
			child.rule = "hardlinebreaks";
		}
	});
	children.push({ type: "element", tag: "br", rule: "hardlinebreaks" });
	return {
		type: "element",
		tag: "p",
		rule: "parseblock",
		children: [{ type: "void", rule: "hardlinebreaks", children: children }]
	};
}

exports.horizontalRule = horizontalRule;
exports.hardBreak = hardBreak;
exports.hardLineBreaksBlock = hardLineBreaksBlock;
