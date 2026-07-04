# Smart Office Asset Manager

Live office monitoring dashboard with simulated devices (fans + lights), real-time SSE updates, and an optional Discord bot — all from a single Express API.

## Features

- **Web dashboard** — per-room device status, power usage, and active alerts
- **REST API** — `/api/devices`, `/api/rooms`, `/api/usage`, `/api/alerts`
- **Live updates** — Server-Sent Events at `/api/events`
- **Discord bot** (optional) — `!status`, `!room`, `!usage` commands

## Deploy on Render (recommended)

This repo includes a [`render.yaml`](render.yaml) Blueprint. One-click deploy:

1. Push this repo to GitHub (already done if you're reading this from GitHub).
2. Go to [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**.
3. Connect your GitHub account and select this repository.
4. Render reads `render.yaml` and creates the `smart-office-dashboard` web service automatically.
5. (Optional) In the service **Environment** tab, add:
   - `DISCORD_BOT_TOKEN` — your Discord bot token
   - `DISCORD_ALERT_CHANNEL_ID` — channel for proactive alerts

After deploy, open your Render URL — the dashboard and API run on the same service.

### Manual Render setup

If you prefer not to use the Blueprint:

| Setting | Value |
|---------|-------|
| **Runtime** | Node |
| **Build Command** | `corepack enable && corepack prepare pnpm@10 --activate && pnpm install --frozen-lockfile && pnpm --filter @workspace/office-dashboard run build && pnpm --filter @workspace/api-server run build` |
| **Start Command** | `node --enable-source-maps artifacts/api-server/dist/index.mjs` |
| **Health Check Path** | `/api/healthz` |

**Environment variables:**

| Variable | Value | Required |
|----------|-------|----------|
| `NODE_ENV` | `production` | Yes |
| `BASE_PATH` | `/` | Yes |
| `SERVE_STATIC_DASHBOARD` | `true` | Yes |
| `PORT` | `10000` (build-time only; Render sets runtime PORT) | Yes |
| `DISCORD_BOT_TOKEN` | Your bot token | No |
| `DISCORD_ALERT_CHANNEL_ID` | Discord channel ID | No |

## Local development

```bash
corepack enable
corepack prepare pnpm@10 --activate
pnpm install

# Terminal 1 — API server
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Dashboard
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/office-dashboard run dev
```

## Stack

- pnpm workspaces, Node.js, TypeScript
- Express 5 API + in-memory device simulation
- React + Vite dashboard
- discord.js v14 (optional)

## License

MIT
