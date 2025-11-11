> there are 3 files involved in tiddlywiki server file and tiddler handling. @core-server/filesystem.js
  @plugins/tiddlywiki/filesystem/filesystemadaptor.js and @plugins/tiddlywiki/tiddlyweb/tiddlywebadaptor.js can you
  tell me what they do and how they work together?

✦ Of course. Let's break down the roles of these three important files and how they form the backbone of
  TiddlyWiki's server-side operations.

  The Big Picture: A Layered Architecture

  Think of it as a three-layer system for handling tiddlers when running on a Node.js server:

   1. The High-Level Manager (`...adaptor.js` files): This layer decides where and how to store tiddlers. It's the
      "sync adaptor" that the TiddlyWiki core talks to. You use one type of adaptor at a time.
   2. The Low-Level Toolkit (`filesystem.js`): This layer provides the tools to actually interact with the disk. It
      knows how to create files, write to them, create directories, and understands the specific file formats for
      tiddlers (.tid, .json, .meta).
   3. The TiddlyWiki Core Syncer (not in these files): At the very top, the core syncer knows that a tiddler has
      changed. It passes the tiddler to the active High-Level Manager (the adaptor) and says, "deal with this."

  Here is a detailed breakdown of each file's role in this architecture.

  ---

  1. @core-server/filesystem.js

  Role: The Low-Level File System Toolkit

  This file is a utility library that contains all the fundamental, low-level functions for interacting with the
  file system specifically for TiddlyWiki's needs. It does not act on its own; it's a collection of tools called
  by other parts of the server, primarily the FileSystemAdaptor.

  Key Responsibilities:

   * Generic File Operations: It has basic functions to wrap Node.js's fs module, like createDirectory,
     deleteDirectory, copyFile, and isDirectory.
   * Tiddler-to-File Logic: This is its most critical role. It contains the logic for how a tiddler in memory
     should be represented on disk.
       * generateTiddlerFileInfo: This function is the "brains" of file formatting. It inspects a tiddler's fields
         (like its type) and decides how it should be saved.
           * If it's a standard text/vnd.tiddlywiki tiddler, it will be saved as a .tid file.
           * If it's a binary file (like an image), it will be saved as the raw file plus a companion .meta file
             containing the tiddler's fields.
           * If the tiddler has complex or "unsafe" fields, it will be saved as a .json file.
       * generateTiddlerFilepath: This function determines the exact path and filename for a tiddler, handling
         things like sanitizing the title to remove illegal characters, preventing path traversal, and adding a
         number (_1, _2) if a file with that name already exists.
   * Saving and Deleting:
       * saveTiddlerToFile: Takes a tiddler and a fileInfo object (from the function above) and performs the actual
         write to disk.
       * deleteTiddlerFile: Deletes a tiddler's file and its associated .meta file if it exists.

  In short, `filesystem.js` is the expert that knows everything about how a tiddler object translates to a file (or
  files) on your hard drive.

  ---

  2. @plugins/tiddlywiki/filesystem/filesystemadaptor.js

  Role: The Local Filesystem Sync Manager

  This is a "sync adaptor." Its job is to be the bridge between the TiddlyWiki core's sync mechanism and the
  local file system. When you run TiddlyWiki on Node.js to serve a folder of tiddlers, this is the default
  adaptor in charge.

  How it Works:

   1. The TiddlyWiki core detects a tiddler has been created, changed, or deleted.
   2. It calls the appropriate method on the active sync adaptor, which is FileSystemAdaptor. The methods are
      saveTiddler, loadTiddler, and deleteTiddler.
   3. The FileSystemAdaptor then uses the `@core-server/filesystem.js` toolkit to do the actual work.
       * When saveTiddler is called, it first calls getTiddlerFileInfo to figure out where and how the file should
         be saved.
       * It then passes the tiddler and the resulting fileInfo to $tw.utils.saveTiddlerToFile to write the data to
         disk.
       * When deleteTiddler is called, it uses $tw.utils.deleteTiddlerFile to remove the file(s) from disk.

  In short, `FileSystemAdaptor` is the manager for a local wiki. It takes orders from the core and delegates the
  detailed file-handling work to the `filesystem.js` toolkit.

  ---

  3. @plugins/tiddlywiki/tiddlyweb/tiddlywebadaptor.js

  Role: The Remote Server Sync Manager

  This is also a "sync adaptor," but it's designed for a completely different scenario. It's used when your
  TiddlyWiki is running in a browser and needs to sync changes with a remote server that follows the "TiddlyWeb"
  API specification.

  It does NOT interact with the local filesystem. Instead, it communicates over the network.

  How it Works:

   1. The TiddlyWiki core (running in the browser) detects a tiddler change.
   2. It calls the saveTiddler method on the active TiddlyWebAdaptor.
   3. Instead of calling file functions, the TiddlyWebAdaptor does the following:
       * It converts the tiddler's data into a JSON format suitable for the TiddlyWeb API.
       * It makes an HTTP request (e.g., PUT, DELETE) to the remote server's URL (e.g.,
         https://your-server.com/recipes/default/tiddlers/MyTiddler).
       * It handles authentication, status checks (/status), and login/logout against the remote server.

  In short, `TiddlyWebAdaptor` is the manager for a remote wiki. It packages up tiddler changes and sends them
  over the internet via HTTP requests. It is an *alternative* to the `FileSystemAdaptor`, not something that
  works with it.

  How They Work Together (and Apart)

   * `FileSystemAdaptor` and `filesystem.js` work as a team. The FileSystemAdaptor is the public-facing manager,
     and filesystem.js is its expert back-office toolkit for all file operations. You use them when running
     TiddlyWiki as a local server on Node.js.

   * `TiddlyWebAdaptor` works alone (on the client-side). It's used for browser-based wikis that save to a remote
     server. It replaces the FileSystemAdaptor. The remote server it talks to might itself be using the
     FileSystemAdaptor and filesystem.js on the back-end to save the tiddlers it receives, but the TiddlyWebAdaptor
     in your browser doesn't know or care about that. It only speaks HTTP.