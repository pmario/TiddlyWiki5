# Revised Architecture for a TiddlyWiki Holepunch Sync Adaptor

This document outlines the architecture for a TiddlyWiki sync adaptor that uses the Holepunch P2P stack. The key insight is that the P2P networking and data storage logic must run on the Node.js server, while the browser-side `syncadaptor` module acts as a client to this server.

### The Core Concept: A Client-Server P2P Model

The architecture consists of three main components that separate the browser-side UI from the server-side P2P engine.

```
+--------------------------+      +--------------------------+      +---------------------------+
|  Browser-Side Sync       |      |   TiddlyWiki Node.js     |      |   Server-Side P2P Engine  |
|  (holepunchadaptor.js)   |      |   Server + API Routes    |      |   (holepunch-utils.js)    |
+--------------------------+      +--------------------------+      +---------------------------+
           |                                |                               |
           |---(HTTP/WebSocket)--->         |---(Internal Calls)--->        |---(P2P Network)---> Peers
           |                                |                               |
           |<--(Real-time Push)----|         |<------------------------------|
```

---

### Architectural Components

#### 1. Server-Side P2P Engine (`holepunch-utils.js`)

This is the core P2P node, implemented as a server-only module.

*   **Module Type:** `utils-node`
*   **Responsibilities:**
    *   Initializes and manages the Holepunch stack: `Corestore` for storage, `Hyperswarm` for peer discovery, and `Autobase` for multi-writer data merging.
    *   Persists the Hypercore data to the server's local filesystem.
    *   Listens for new data from the P2P network and updates its internal `Autobase` log.
    *   Exposes functions for the server's API endpoints to call (e.g., `addTiddlerToLog`, `getTiddlerFromLog`).

#### 2. Server-Side API Endpoints (New Command Module)

This component exposes the P2P engine to the browser over HTTP.

*   **Module Type:** `command` (or integrated into the main server startup).
*   **Responsibilities:**
    *   Creates new HTTP API routes (e.g., `POST /holepunch/tiddlers`, `GET /holepunch/tiddlers`).
    *   Handles requests from the browser, calling the appropriate functions in `holepunch-utils.js`.
    *   Implements a real-time push mechanism (e.g., using WebSockets) to notify the browser client immediately when a new tiddler arrives from the P2P network.

#### 3. Browser-Side Sync Adaptor (`holepunchadaptor.js`)

This is the client-side module that integrates with the TiddlyWiki syncer. Its role is now purely to communicate with its own back-end server.

*   **Module Type:** `syncadaptor`
*   **Responsibilities:**
    *   `saveTiddler`: Makes a `POST` HTTP request to the server's `/holepunch/tiddlers` endpoint with the tiddler data.
    *   `deleteTiddler`: Makes a `DELETE` HTTP request.
    *   `getSkinnyTiddlers`: Makes a `GET` request on startup to fetch the list of all tiddlers.
    *   Listens for real-time push notifications (via WebSocket) from the server to receive updates from other peers, and then adds those tiddlers to the local wiki.

### Summary of the Workflow

1.  **Initialization:** The TiddlyWiki server starts, and the `holepunch-utils.js` module initializes the P2P stack and connects to the swarm. The browser loads the wiki and the `holepunchadaptor.js` fetches the initial tiddler list from the server via HTTP.
2.  **Local Edit:** A user saves a tiddler in their browser. The `holepunchadaptor.js` sends the tiddler data to the server via a `POST` request.
3.  **Server Handling:** The server's API endpoint receives the request and calls `holepunch-utils.js` to append the change to the `Autobase` log. The P2P network propagates this change to all peers.
4.  **Remote Edit (Receiving):** A peer server's `holepunch-utils.js` receives a new log entry from the P2P network. It notifies its connected browser client via a WebSocket push. The browser's `holepunchadaptor.js` receives the push and calls `$tw.wiki.addTiddler()` to make the change visible locally, achieving auto-sync.
