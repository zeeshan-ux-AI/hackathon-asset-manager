---
name: Stateful derived alerts
description: How to compute recurring, condition-based alerts (e.g. "device left on too long") so they have stable IDs, correct createdAt, and resolve cleanly.
---

Model this kind of alert as a `Map<alertKey, Alert>` recomputed on every simulation/poll tick, not as an append-only log of events.

- `alertKey` is deterministic and stable for the condition instance (e.g. `` `after_hours:${room}` ``, `` `prolonged_use:${room}` ``) — not time-based, so the same ongoing condition maps to the same alert across ticks.
- On each tick: if the condition is newly true, insert into the map with `createdAt = now` and record it as a "new" alert (for anything that needs to react to new alerts, like posting a proactive notification). If already true, keep the existing `createdAt` but refresh any mutable fields (message text, affected IDs). If no longer true, delete the key.

**Why:** naive approaches either re-timestamp the alert every poll (losing "how long has this been true"), or spam duplicate alerts every tick. The Map-diff approach gives correct duration tracking and a clean "new alert" signal for side effects, with automatic resolution when the condition clears.

**How to apply:** any polling/ticking system with condition-based (not one-off-event-based) alerts — inactivity alerts, threshold breaches, "still running" warnings, etc.
