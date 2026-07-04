# Lights, Fans, Discord: The Boss's Big Idea

A Smart Office monitoring system: a shared Express backend simulates 15 devices (fans + lights) across 3 rooms and serves both a real-time web dashboard and a Discord bot from a single in-memory source of truth.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (simulated devices, alerts engine, Discord bot)
- `pnpm --filter @workspace/office-dashboard run dev` — run the web dashboard (normally started via its workflow, not manually)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required secrets for the Discord bot (optional — API/dashboard work without them):
  - `DISCORD_BOT_TOKEN` — bot login token
  - `DISCORD_ALERT_CHANNEL_ID` — channel ID where proactive alerts get posted (optional bonus feature; commands still work without it)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, in-memory device simulation (no database — state resets on server restart, by design)
- Frontend: React + Vite dashboard, live updates via native SSE (`/api/events`)
- Discord bot: discord.js v14, runs in the same process as the API server
- Validation: Zod (`zod/v4`)
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for `/devices`, `/rooms/{roomId}`, `/usage`, `/alerts` contracts
- `artifacts/api-server/src/lib/deviceStore.ts` — the single source of truth for all 15 devices' live state, simulation loop, and the `deviceEvents` EventEmitter that both SSE and the Discord bot subscribe to
- `artifacts/api-server/src/lib/alertsEngine.ts` — stateful alert detection (after-hours, prolonged use) with stable alert IDs so alerts persist correctly across polls
- `artifacts/api-server/src/lib/discordBot.ts` — `!status` / `!room <name>` / `!usage` commands plus proactive alert posting
- `artifacts/api-server/src/routes/devices.ts` — REST endpoints + raw SSE endpoint at `/api/events`
- `artifacts/office-dashboard/src/hooks/use-live-data.ts` — frontend SSE subscription that invalidates React Query caches on every device change

## Architecture decisions

- Discord bot runs in-process with the API server (not a separate service) so both surfaces read the exact same in-memory device state with zero HTTP hop or sync lag — satisfies the "single source of truth" requirement simply.
- No database: device state is simulated in memory and intentionally resets on restart. This is a live simulation demo, not a system of record.
- Alerts are computed as a derived, stateful projection (`Map<alertKey, Alert>`) rather than stored/logged events, so an alert's `createdAt` reflects when the condition first became true, not when it was last polled.
- Discord bot responses use hand-tuned, data-grounded templated phrasing (not an LLM call) to keep the bot fast, free, and dependency-light — every reply is built directly from live device/usage/alert data, never hardcoded or random.

## Product

- Live per-room and whole-office device status (15 devices: 2 fans @60W + 3 lights @15W across Drawing Room, Work Room 1, Work Room 2)
- Live power meter: total wattage + per-room breakdown + estimated daily kWh, updating over SSE with zero polling
- Active alerts: after-hours usage (outside 9am-5pm) and prolonged use (room fully-on for 2+ hours)
- Discord bot: `!status`, `!room <name>`, `!usage`, `!help`, plus proactive alert posting to a configured channel

## User preferences

_None recorded yet._

## Gotchas

- The Discord bot silently no-ops if `DISCORD_BOT_TOKEN` is missing (logs a warning) — the API and dashboard fully function without it.
- Office hours (9am-5pm) are evaluated against the server's local clock, not any per-room timezone.
- Restarting the API server resets all device state (in-memory only, no persistence) — this is intentional for the simulation.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
