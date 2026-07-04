import { ROOM_LABELS, ROOMS, type RoomId } from "./rooms";
import type { DeviceState } from "./deviceStore";

export type AlertType = "after_hours" | "prolonged_use";

export interface AlertState {
  id: string;
  type: AlertType;
  room: RoomId;
  message: string;
  createdAt: string;
  deviceIds: string[];
}

const OFFICE_HOURS_START = 9;
const OFFICE_HOURS_END = 17;
const PROLONGED_USE_MS = 2 * 60 * 60 * 1000;

const activeAlerts = new Map<string, AlertState>();

function formatClockTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function refreshAlerts(devices: DeviceState[]): {
  alerts: AlertState[];
  newAlerts: AlertState[];
} {
  const now = new Date();
  const hour = now.getHours();
  const isAfterHours = hour < OFFICE_HOURS_START || hour >= OFFICE_HOURS_END;
  const nowIso = now.toISOString();
  const seenKeys = new Set<string>();
  const newAlerts: AlertState[] = [];

  for (const room of ROOMS) {
    const roomDevices = devices.filter((d) => d.room === room.id);
    const onDevices = roomDevices.filter((d) => d.isOn);

    const afterHoursKey = `after_hours:${room.id}`;
    if (isAfterHours && onDevices.length > 0) {
      seenKeys.add(afterHoursKey);
      const fans = onDevices.filter((d) => d.type === "fan").length;
      const lights = onDevices.filter((d) => d.type === "light").length;
      const parts: string[] = [];
      if (fans > 0) parts.push(pluralize(fans, "fan"));
      if (lights > 0) parts.push(pluralize(lights, "light"));
      const message = `${ROOM_LABELS[room.id]} still has ${parts.join(" and ")} ON at ${formatClockTime(now)}. Did someone forget to leave?`;

      const existing = activeAlerts.get(afterHoursKey);
      if (existing) {
        existing.deviceIds = onDevices.map((d) => d.id);
        existing.message = message;
      } else {
        const alert: AlertState = {
          id: afterHoursKey,
          type: "after_hours",
          room: room.id,
          message,
          createdAt: nowIso,
          deviceIds: onDevices.map((d) => d.id),
        };
        activeAlerts.set(afterHoursKey, alert);
        newAlerts.push(alert);
      }
    }

    const prolongedKey = `prolonged_use:${room.id}`;
    const allOn = roomDevices.length > 0 && roomDevices.every((d) => d.isOn);
    const allOnLongEnough =
      allOn &&
      roomDevices.every(
        (d) => now.getTime() - new Date(d.lastChangedAt).getTime() > PROLONGED_USE_MS,
      );

    if (allOnLongEnough) {
      seenKeys.add(prolongedKey);
      if (!activeAlerts.has(prolongedKey)) {
        const alert: AlertState = {
          id: prolongedKey,
          type: "prolonged_use",
          room: room.id,
          message: `${ROOM_LABELS[room.id]} has had every device running continuously for over 2 hours. Worth checking if that's intentional.`,
          createdAt: nowIso,
          deviceIds: roomDevices.map((d) => d.id),
        };
        activeAlerts.set(prolongedKey, alert);
        newAlerts.push(alert);
      }
    }
  }

  for (const key of Array.from(activeAlerts.keys())) {
    if (!seenKeys.has(key)) {
      activeAlerts.delete(key);
    }
  }

  return { alerts: Array.from(activeAlerts.values()), newAlerts };
}

export function getActiveAlerts(): AlertState[] {
  return Array.from(activeAlerts.values());
}
