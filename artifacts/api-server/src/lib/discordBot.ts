import {
  Client,
  GatewayIntentBits,
  Partials,
  TextChannel,
  type Message,
} from "discord.js";
import { logger } from "./logger";
import { getDevices, getRoomSummary, getUsageSummary } from "./deviceStore";
import { deviceEvents } from "./deviceStore";
import type { AlertState } from "./alertsEngine";
import { ROOM_LABELS, ROOMS, resolveRoomId } from "./rooms";

const PREFIX = "!";

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function humanizeStatus(): string {
  const devices = getDevices();
  const on = devices.filter((d) => d.isOn);
  const off = devices.filter((d) => !d.isOn);
  const totalWatts = on.reduce((sum, d) => sum + d.powerDrawWatts, 0);

  if (on.length === 0) {
    return "Every single device across all three rooms is off right now. The office is fully dark and drawing zero watts. Nothing to worry about here.";
  }

  const lines: string[] = [];
  lines.push(
    `Right now ${pluralize(on.length, "device")} out of ${devices.length} are running, pulling a combined ${totalWatts}W.`,
  );

  for (const room of ROOMS) {
    const roomOn = on.filter((d) => d.room === room.id);
    if (roomOn.length === 0) continue;
    const fans = roomOn.filter((d) => d.type === "fan").length;
    const lights = roomOn.filter((d) => d.type === "light").length;
    const parts: string[] = [];
    if (fans > 0) parts.push(pluralize(fans, "fan"));
    if (lights > 0) parts.push(pluralize(lights, "light"));
    lines.push(`${ROOM_LABELS[room.id]}: ${parts.join(" and ")} on.`);
  }

  if (off.length === devices.length - on.length && off.length > 0) {
    lines.push(`${pluralize(off.length, "device")} sitting idle elsewhere.`);
  }

  return lines.join("\n");
}

function humanizeRoom(roomInput: string): string {
  const roomId = resolveRoomId(roomInput);
  if (!roomId) {
    return `I don't recognize "${roomInput}" as a room. Try one of: Drawing Room, Work Room 1, Work Room 2.`;
  }

  const summary = getRoomSummary(roomId);
  if (summary.activeDeviceCount === 0) {
    return `${ROOM_LABELS[roomId]} is completely quiet — all ${summary.deviceCount} devices are off, drawing 0W.`;
  }

  const on = summary.devices.filter((d) => d.isOn);
  const fans = on.filter((d) => d.type === "fan").length;
  const lights = on.filter((d) => d.type === "light").length;
  const parts: string[] = [];
  if (fans > 0) parts.push(pluralize(fans, "fan"));
  if (lights > 0) parts.push(pluralize(lights, "light"));

  return `${ROOM_LABELS[roomId]} has ${parts.join(" and ")} running out of ${summary.deviceCount} devices, drawing ${summary.totalWatts}W total.`;
}

function humanizeUsage(): string {
  const usage = getUsageSummary();
  const lines: string[] = [];
  lines.push(
    `Total draw right now is ${usage.totalWatts}W across ${usage.activeDeviceCount} of ${usage.totalDeviceCount} devices — roughly ${usage.estimatedDailyKwh} kWh if that pace held for a full day.`,
  );
  for (const room of usage.perRoom) {
    lines.push(
      `${ROOM_LABELS[room.room]}: ${room.watts}W (${room.activeDeviceCount}/${room.deviceCount} devices on).`,
    );
  }
  return lines.join("\n");
}

function humanizeAlert(alert: AlertState): string {
  const prefix = alert.type === "after_hours" ? "After-hours alert" : "Prolonged use alert";
  return `**${prefix} — ${ROOM_LABELS[alert.room]}**\n${alert.message}`;
}

export function startDiscordBot(): void {
  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token) {
    logger.warn(
      "DISCORD_BOT_TOKEN not set — skipping Discord bot startup. Devices/usage/alerts API still works.",
    );
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel],
  });

  client.once("ready", () => {
    logger.info(
      { user: client.user?.tag },
      "Discord bot connected and ready",
    );
  });

  client.on("messageCreate", (message: Message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const [rawCommand, ...rest] = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const command = rawCommand?.toLowerCase();

    try {
      if (command === "status") {
        void message.reply(humanizeStatus());
      } else if (command === "room") {
        const roomArg = rest.join(" ");
        if (!roomArg) {
          void message.reply(
            "Tell me which room — try `!room drawing_room`, `!room work_room_1`, or `!room work_room_2`.",
          );
          return;
        }
        void message.reply(humanizeRoom(roomArg));
      } else if (command === "usage") {
        void message.reply(humanizeUsage());
      } else if (command === "help") {
        void message.reply(
          "Commands: `!status` (whole office), `!room <name>` (one room), `!usage` (power breakdown).",
        );
      }
    } catch (err) {
      logger.error({ err }, "Error handling Discord command");
      void message.reply("Something went wrong pulling that data. Try again in a moment.");
    }
  });

  const alertChannelId = process.env["DISCORD_ALERT_CHANNEL_ID"];
  if (alertChannelId) {
    deviceEvents.on("newAlert", (alert: AlertState) => {
      void (async () => {
        try {
          const channel = await client.channels.fetch(alertChannelId);
          if (channel instanceof TextChannel) {
            await channel.send(humanizeAlert(alert));
          }
        } catch (err) {
          logger.error({ err }, "Failed to post proactive alert to Discord");
        }
      })();
    });
  } else {
    logger.warn(
      "DISCORD_ALERT_CHANNEL_ID not set — proactive alert posting is disabled, commands still work.",
    );
  }

  client.login(token).catch((err: unknown) => {
    logger.error({ err }, "Failed to log in to Discord");
  });
}
