---
name: Discord bot "Missing Access" on proactive channel post
description: DiscordAPIError 50001 when the bot fetches/posts to a configured alert channel, even though the bot is already in the server
---

A bot can be successfully invited/logged into a Discord server (commands like `!status` work fine) yet still get `DiscordAPIError[50001]: Missing Access` specifically when fetching or posting to one particular channel ID.

**Why:** Server membership and per-channel permissions are separate. The bot's role can lack "View Channel" / "Send Messages" on that one channel (permission overwrite), or the configured channel ID can belong to a different server/category than the one the bot was invited to, or point to a non-text channel.

**How to apply:** Don't assume "bot is in the server" rules this out. Ask the user to: (1) re-copy the channel ID with Developer Mode on, right-click the exact text channel → Copy Channel ID; (2) check that channel's permission overwrites explicitly grant the bot's role View Channel + Send Messages (server-wide permissions don't always cascade if the channel has overwrites).
