/*\
title: $:/core/modules/filters/enlist.js
type: application/javascript
module-type: filteroperator

Filter operator returning its operand parsed as a list

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.enlist = function(source,operator,options) {
	var allowDuplicates = false,
		createFilter = false;
	var list = [];
	
	switch(operator.suffix) {
		case "raw":
			allowDuplicates = true;
			break;
		case "dedupe":
			allowDuplicates = false;
			break;
		case "text":
			allowDuplicates = false;
			createFilter=true;
			break;
	}
	list = (createFilter) ? $tw.utils.parseFilterArray(operator.operand,allowDuplicates) : $tw.utils.parseStringArray(operator.operand,allowDuplicates);
	if(operator.prefix === "!") {
		var results = [];
		source(function(tiddler,title) {
			if(list.indexOf(title) === -1) {
				results.push(title);
			}
		});
		return results;
	} else {
		return list;
	}
};

})();
