#!/bin/bash

# global settings
# set -o nounset
set -o errexit

# build TiddlyWiki5 for tiddlywiki.com

# get command path info 
ARG0=$(basename $0 .sh)
ARG0DIR=$(dirname $0)
[ $ARG0DIR == "." ] && ARG0DIR=$PWD 

# Set up the build output directory
# You can set a custom environment variable in your .bashrc to overwrite the default setting.
# With the "-d Option" this setting can be overwritten too. The command line Option will win!
if [ -z "$TW5_BUILD_OUTPUT" ]; then
    TW5_BUILD_OUTPUT=../jermolene.github.com
fi

if [ -z "$TW5_CNAME" ]; then
    TW5_CNAME=tiddlywiki.com
fi

if [ ! -d "$TW5_BUILD_OUTPUT" ]; then
    echo TW5_BUILD_OUTPUT is ["$TW5_BUILD_OUTPUT"]
    echo 'A valid TW5_BUILD_OUTPUT environment variable must be set'
    exit 1
fi

# Create output directory and do some cleaning.
init() {
	_log "TW5_BUILD_OUTPUT directory created on demand: [$TW5_BUILD_OUTPUT]"
	mkdir -p "$TW5_BUILD_OUTPUT"

	# create the CNAME file for GitHub pages
	echo $TW5_CNAME > "$TW5_BUILD_OUTPUT"/CNAME

	# Create the `static` directories if necessary
	# Delete any existing content .. no error message
	mkdir -p $TW5_BUILD_OUTPUT/static
	rm -r $TW5_BUILD_OUTPUT/static

	mkdir -p $TW5_BUILD_OUTPUT/static
}

# The tw5.com wiki
#  index.html: the main file, including content
#  empty.html: the main file, excluding content
#  static.html: the static version of the default tiddlers
tw5com () {
	_log "create index.html, empty.html and static files for tiddlywiki.com"
	
	# create tiddlywiki.com content
	node ./tiddlywiki.js \
		./editions/tw5.com \
		--verbose \
		--rendertiddler $:/core/save/all $TW5_BUILD_OUTPUT/index.html text/plain \
		--savetiddler $:/favicon.ico $TW5_BUILD_OUTPUT/favicon.ico \
		--rendertiddler ReadMe ./readme.md text/html \
		--rendertiddler ContributingTemplate ./contributing.md text/html \
		--rendertiddler $:/editions/tw5.com/download-empty $TW5_BUILD_OUTPUT/empty.html text/plain \
		--rendertiddler $:/editions/tw5.com/download-empty $TW5_BUILD_OUTPUT/empty.hta text/plain \
		--savetiddler $:/green_favicon.ico $TW5_BUILD_OUTPUT/static/favicon.ico \
		--rendertiddler $:/core/templates/static.template.html $TW5_BUILD_OUTPUT/static.html text/plain \
		--rendertiddler $:/core/templates/alltiddlers.template.html $TW5_BUILD_OUTPUT/alltiddlers.html text/plain \
		--rendertiddler $:/core/templates/static.template.css $TW5_BUILD_OUTPUT/static/static.css text/plain \
		--rendertiddlers [!is[system]] $:/core/templates/static.tiddler.html $TW5_BUILD_OUTPUT/static text/plain \
		|| exit 1
}
tw () {
	tw5com
}

# create the bare minimum for testing
index () {
	_log "create index.html"
	node ./tiddlywiki.js \
		./editions/tw5.com \
		--verbose \
		--rendertiddler $:/core/save/all $TW5_BUILD_OUTPUT/index.html text/plain \
		--savetiddler $:/favicon.ico $TW5_BUILD_OUTPUT/favicon.ico \
		|| exit 1
}
i () {
	index
}

# encrypted.html: a version of the main file encrypted with the password "password"
encrypted () {
	_log "create encrypted.html"
	node ./tiddlywiki.js \
		./editions/tw5.com \
		--verbose \
		--password password \
		--rendertiddler $:/core/save/all $TW5_BUILD_OUTPUT/encrypted.html text/plain \
		|| exit 1
}
e () {
	encrypted
}

# -------- all editions below could be optimized --------
# TODO

# tahoelafs.html: empty wiki with plugin for Tahoe-LAFS
tahoe () {
	_log "create tahoelafs.html"
	node ./tiddlywiki.js \
		./editions/tahoelafs \
		--verbose \
		--rendertiddler $:/core/save/all $TW5_BUILD_OUTPUT/tahoelafs.html text/plain \
		|| exit 1
}

# d3demo.html: wiki to demo d3 plugin
d3 () {
	_log "create d3demo.html"
	node ./tiddlywiki.js \
		./editions/d3demo \
		--verbose \
		--rendertiddler $:/core/save/all $TW5_BUILD_OUTPUT/d3demo.html text/plain \
	|| exit 1
}

# codemirrordemo.html: wiki to demo codemirror plugin
codemirror () {
	_log "create codemirrordemo.html"
	node ./tiddlywiki.js \
		./editions/codemirrordemo \
		--verbose \
		--rendertiddler $:/core/save/all $TW5_BUILD_OUTPUT/codemirrordemo.html text/plain \
		|| exit 1
}
cm () {
	codemirror
}

# markdowndemo.html: wiki to demo markdown plugin
markdown () {
	_log "create markdowndemo.html"
	node ./tiddlywiki.js \
		./editions/markdowndemo \
		--verbose \
		--rendertiddler $:/core/save/all $TW5_BUILD_OUTPUT/markdowndemo.html text/plain \
		|| exit 1
}
md () {
	markdown
}

# highlightdemo.html: wiki to demo highlight plugin
highlight () {
	_log "create highlightdemo.html"
	node ./tiddlywiki.js \
		./editions/highlightdemo \
		--verbose \
		--rendertiddler $:/core/save/all $TW5_BUILD_OUTPUT/highlightdemo.html text/plain \
		|| exit 1
}
hl () {
	highlight
}

# Run the test edition to run the Node.js tests and to generate test.html for tests in the browser
tests () {
	_log "create test.html"
	node ./tiddlywiki.js \
		./editions/test \
		--verbose \
		--rendertiddler $:/core/save/all $TW5_BUILD_OUTPUT/test.html text/plain \
		|| exit 1
}

# ---- helper functions ----
_log () {
	echo
	echo "---> $1"
#	echo "---> using [$TW5_BUILD_OUTPUT] as TW5_BUILD_OUTPUT directory!"
}

version () {
	echo "$ARG0.sh, TiddlyWiki builder, Version 0.0.1"
	echo $'\t'"Copyright © Jeremy Ruston 2004-2007"
	echo $'\t'"Copyright © UnaMesa Association 2007-2014"
	echo
}

usage() {
	version
	echo Usage:$'\t'$ARG0.sh [Options] [Edition] [Edition] ... 
	echo
}

help() {
	usage

	echo Edition:
	echo $'\t'all $'\t'$'\t'     .. "default, will create the following editions & tests in one run!"
	echo $'\t'tw, tw5com $'\t'   .. create everything needed for http://tiddlywiki.com
	echo $'\t'tests $'\t'$'\t'   .. run the testsuite
	echo $'\t'i, index $'\t'     .. index.html - just the index file from: http://tiddlywiki.com
	echo $'\t'e, encrypted $'\t' .. an encrypted index.html
	echo $'\t'tahoe $'\t'$'\t'   .. tahoelafs, see: https://tahoe-lafs.org/trac/tahoe-lafs
	echo $'\t'd3 $'\t'$'\t'      .. d3 plugin demo. see: http://tiddlywiki.com/d3demo.html
	echo $'\t'cm, codemirror $'\t' .. codemirror demo. see: http://tiddlywiki.com/codemirrordemo.html
	echo $'\t'md, markdown $'\t'   .. markdown demo. see: http://tiddlywiki.com/markdowndemo.html
	echo $'\t'hl, highlight $'\t'  .. code highlighting demo. see: ????
	echo $'\t'serve $'\t'$'\t'     .. start the dev server [port] [username] [password] [custom IP]. 
	echo $'\t'$'\t'$'\t'     .. default IP is 127.0.0.1 
	echo
	echo Options:
	echo
	echo $'\t'-e .. Editions path. Can be relative. default: ./editions
	echo $'\t'-d .. Output Directory for the compiled file. default: ../jermolene.github.com
	echo $'\t'-o .. "Output file name. default: [Editions name].html"
	echo $'\t'-c .. CNAME needed for GitHub pages. default: tiddlywiki.com
	echo
	echo $'\t'-v .. Version
	echo $'\t'-h .. Help
	echo	
}

# error handling
error() {
    echo "$ARG0: $*" 1>&2
    exit 1
}

# create all files
all () {
	tw5com		# contains index
	encrypted
	tahoe
	d3
	codemirror
	markdown
	highlight
	
	# creating everything does run the test suite
	tests
}

custom () {
	# define default variables
	[ -z $TW5_EDITION_DIR ] && TW5_EDITION_DIR=./editions
	[ -z $TW5_EDITION ] && TW5_EDITION=custom
	[ -z $TW5_OUTFILE ] && TW5_OUTFILE="$TW5_EDITION".html
	
	_log "create custom build / edition"
	
	node ./tiddlywiki.js \
		"$TW5_EDITION_DIR"/"$TW5_EDITION" \
		--verbose \
		--rendertiddler $:/core/save/all "$TW5_BUILD_OUTPUT"/"$TW5_OUTFILE" text/plain \
		--savetiddler $:/favicon.ico $TW5_BUILD_OUTPUT/favicon.ico \
		|| exit 1
}

# start the server
# TODO ... remove the hardcoded params.
serve () {
	node ./tiddlywiki.js \
		./editions/clientserver \
		--verbose \
		--server 8080 $:/core/save/all text/plain text/html $1 $2 $3 \
		|| exit 1
}

# the handler
while getopts vhe:d:o:c: flag
do
    case "$flag" in
    (e) TW5_EDITION_DIR="$OPTARG"
		#echo $TW5_EDITION_DIR
		;;
    (d) TW5_BUILD_OUTPUT="$OPTARG"
		#echo $TW5_BUILD_OUTPUT
		;;
    (o) TW5_OUTFILE="$OPTARG"
		#echo $TW5_OUTFILE
		;;
    (c) TW5_CNAME="$OPTARG";;
    (h) help; exit 0;;
    (v) version; exit 0;;
    (*) help
		echo "---> At least one Option doesn't exist!"
		exit 1;;
    esac
done
shift $(expr $OPTIND - 1)

# call the init stuff
init

# If no parameter / Edition is provided, create all
if [ $# -eq 0 ]; then
	help
	all
else
	# print version info
	# version
	
	# loop through all the provided Editions 
	for i in $@
	do
		$i
	done
fi

