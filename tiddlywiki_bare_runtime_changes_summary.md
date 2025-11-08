# TiddlyWiki Bare Runtime Integration Summary

This document summarizes the modifications made to integrate TiddlyWiki with the Bare JavaScript runtime, addressing various compatibility issues encountered during the process.

## Changes Implemented:

### 1. `package.json` Updates
*   **Purpose**: To declare necessary Bare runtime dependencies and map Node.js built-in modules to their Bare-compatible equivalents using `npm:` aliases.
*   **Details**:
    *   Added `bare-*` packages (e.g., `bare-runtime`, `bare-fs`, `bare-path`, `bare-vm`, `bare-http`, `bare-process`, `bare-os`, `bare-events`, `bare-url`, `bare-querystring`, etc.) as direct dependencies.
    *   Introduced `npm:` aliases for standard Node.js modules (e.g., `"fs": "npm:bare-node-fs"`) to ensure TiddlyWiki's `require()` calls correctly resolve to the Bare-compatible implementations.

### 2. `start-bare.js` Entry Point
*   **Purpose**: To act as the initial script executed by the Bare runtime, setting up the environment for TiddlyWiki.
*   **Details**:
    *   Sets `global.process` to the `bare-process` module, providing TiddlyWiki with a compatible `process` object.
    *   Constructs the `$tw.boot.argv` array in the format TiddlyWiki expects (`['bare', 'tiddlywiki.js', ...actual_args]`), ensuring correct parsing of command-line arguments like edition paths, commands (`--listen`), and command-specific parameters (`port=`, `host=`).

### 3. `core-server/server/server.js` Modifications
*   **Purpose**: To address specific API incompatibilities and bugs in the Bare runtime's implementations of standard Node.js functionalities, particularly concerning network and URL handling.
*   **Details**:
    *   **Port Type Coercion**: Modified the `server.listen` call to explicitly convert the `port` argument to a `Number` using `parseInt(port, 10)`. This resolved an issue where `bare-http` was sensitive to the `port`'s type and would default to a random port if a string was provided.
    *   **Manual URL and Query String Parsing**: Replaced the usage of both the legacy `url.parse()` and the modern `new URL()` APIs with a custom, manual URL and query string parser. This was a critical workaround for fatal bugs found in the Bare runtime's implementations of these standard URL parsing functionalities. The manual parser:
        *   Extracts `pathname` and `queryString` from `request.url` using basic string manipulation.
        *   Manually parses the `queryString` into a plain JavaScript object (`state.queryParameters`), replicating the expected output of `querystring.parse()` without relying on the faulty `bare-node-querystring` module.

These changes collectively enable TiddlyWiki's server to start correctly, listen on the specified port, and handle incoming HTTP requests without crashing within the Bare runtime environment.