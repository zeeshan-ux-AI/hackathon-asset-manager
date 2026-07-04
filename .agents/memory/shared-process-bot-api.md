---
name: Shared-process bot + API pattern
description: When a chat bot (Discord/Slack) and a web API must both reflect one live, frequently-changing in-memory state, run them in the same process.
---

Run the bot client (e.g. discord.js) inside the same Node process as the API server, both importing the same in-memory store module, instead of making the bot a separate service that calls the API over HTTP.

**Why:** avoids an HTTP round trip and any possibility of the bot and API drifting out of sync for state that changes every few seconds. Also lets the bot subscribe directly to the store's event emitter for proactive notifications (e.g. posting alerts) without polling.

**How to apply:** when a project needs a single "live source of truth" (device simulation, game state, etc.) consumed by both a web dashboard and a bot, put the state + EventEmitter in one module, mount the HTTP routes and the bot client from the same entrypoint (started after the HTTP server begins listening), and have the bot gracefully no-op (log a warning, skip login) if its token secret isn't set yet — don't let a missing bot credential block the rest of the app.
