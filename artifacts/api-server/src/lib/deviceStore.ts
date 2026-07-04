import { EventEmitter } from "node:events";
import { logger } from "./logger";
import { ROOMS, type DeviceType, type RoomId } from "./rooms";
import { refreshAlerts } from "./alertsEngine";

export interface DeviceState {
  id: string;
  name: string;
  type: DeviceType;
  room: RoomId;
  isOn: boolean;
  powerDrawWatts: number;
  ratedWatts: number;
  lastChangedAt: string;
}

export interface RoomUsage {
  room: RoomId;
  watts: number;
  activeDeviceCount: number;
  deviceCount: number;
}

export interface UsageSummary {
  totalWatts: number;
  estimatedDailyKwh: number;
  activeDeviceCount: number;
  totalDeviceCount: number;
  perRoom: RoomUsage[];
  generatedAt: string;
}

export interface RoomSummary {
  room: RoomId;
  devices: DeviceState[];
  totalWatts: number;
  activeDeviceCount: number;
  deviceCount: number;
}

const FAN_RATED_WATTS = 60;
const LIGHT_RATED_WATTS = 15;
const FANS_PER_ROOM = 2;
const LIGHTS_PER_ROOM = 3;
const SIMULATION_INTERVAL_MS = 5000;

export const deviceEvents = new EventEmitter();

function buildInitialDevices(): DeviceState[] {
  const now = Date.now();
  const devices: DeviceState[] = [];

  for (const room of ROOMS) {
    for (let i = 1; i <= FANS_PER_ROOM; i++) {
      devices.push(makeDevice(room.id, "fan", i, now));
    }
    for (let i = 1; i <= LIGHTS_PER_ROOM; i++) {
      devices.push(makeDevice(room.id, "light", i, now));
    }
  }

  // Seed a realistic mix so the dashboard has live data immediately: some
  // devices on right now, a couple that have been on for over two hours so
  // the "prolonged use" alert has something real to show on first load.
  const seedOnIds = [
    `${ROOMS[0].id}-light-1`,
    `${ROOMS[1].id}-fan-1`,
    `${ROOMS[1].id}-fan-2`,
    `${ROOMS[1].id}-light-1`,
    `${ROOMS[1].id}-light-2`,
    `${ROOMS[1].id}-light-3`,
    `${ROOMS[2].id}-fan-1`,
    `${ROOMS[2].id}-light-2`,
  ];
  const longRunningIds = new Set([
    `${ROOMS[1].id}-fan-1`,
    `${ROOMS[1].id}-fan-2`,
    `${ROOMS[1].id}-light-1`,
    `${ROOMS[1].id}-light-2`,
    `${ROOMS[1].id}-light-3`,
  ]);

  for (const device of devices) {
    if (seedOnIds.includes(device.id)) {
      device.isOn = true;
      device.powerDrawWatts = device.ratedWatts;
      const minutesAgo = longRunningIds.has(device.id) ? 150 : 12;
      device.lastChangedAt = new Date(
        now - minutesAgo * 60 * 1000,
      ).toISOString();
    }
  }

  return devices;
}

function makeDevice(
  room: RoomId,
  type: DeviceType,
  index: number,
  now: number,
): DeviceState {
  const ratedWatts = type === "fan" ? FAN_RATED_WATTS : LIGHT_RATED_WATTS;
  const label = type === "fan" ? "Fan" : "Light";
  return {
    id: `${room}-${type}-${index}`,
    name: `${label} ${index}`,
    type,
    room,
    isOn: false,
    powerDrawWatts: 0,
    ratedWatts,
    lastChangedAt: new Date(now).toISOString(),
  };
}

let devices: DeviceState[] = buildInitialDevices();

export function getDevices(): DeviceState[] {
  return devices.map((device) => ({ ...device }));
}

export function getRoomSummary(room: RoomId): RoomSummary {
  const roomDevices = getDevices().filter((device) => device.room === room);
  const activeDeviceCount = roomDevices.filter((d) => d.isOn).length;
  const totalWatts = roomDevices.reduce((sum, d) => sum + d.powerDrawWatts, 0);
  return {
    room,
    devices: roomDevices,
    totalWatts,
    activeDeviceCount,
    deviceCount: roomDevices.length,
  };
}

export function getUsageSummary(): UsageSummary {
  const all = getDevices();
  const perRoom: RoomUsage[] = ROOMS.map((room) => {
    const roomDevices = all.filter((d) => d.room === room.id);
    return {
      room: room.id,
      watts: roomDevices.reduce((sum, d) => sum + d.powerDrawWatts, 0),
      activeDeviceCount: roomDevices.filter((d) => d.isOn).length,
      deviceCount: roomDevices.length,
    };
  });
  const totalWatts = perRoom.reduce((sum, r) => sum + r.watts, 0);
  const activeDeviceCount = all.filter((d) => d.isOn).length;

  return {
    totalWatts,
    estimatedDailyKwh: Math.round(((totalWatts * 24) / 1000) * 100) / 100,
    activeDeviceCount,
    totalDeviceCount: all.length,
    perRoom,
    generatedAt: new Date().toISOString(),
  };
}

export function setDeviceState(
  deviceId: string,
  isOn: boolean,
): DeviceState | undefined {
  const index = devices.findIndex((device) => device.id === deviceId);
  if (index === -1) return undefined;

  const device = devices[index]!;
  if (device.isOn === isOn) {
    return { ...device };
  }

  const nowIso = new Date().toISOString();
  const updated: DeviceState = {
    ...device,
    isOn,
    powerDrawWatts: isOn ? device.ratedWatts : 0,
    lastChangedAt: nowIso,
  };
  devices[index] = updated;

  const { newAlerts } = refreshAlerts(getDevices());
  deviceEvents.emit("update", { devices: getDevices() });
  for (const alert of newAlerts) {
    deviceEvents.emit("newAlert", alert);
  }

  return { ...updated };
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function tick(): void {
  const toggleCount = randomInt(0, 2);
  const nowIso = new Date().toISOString();

  for (let i = 0; i < toggleCount; i++) {
    const index = randomInt(0, devices.length - 1);
    const device = devices[index];
    if (!device) continue;
    const nextIsOn = !device.isOn;
    devices[index] = {
      ...device,
      isOn: nextIsOn,
      powerDrawWatts: nextIsOn ? device.ratedWatts : 0,
      lastChangedAt: nowIso,
    };
  }

  const { newAlerts } = refreshAlerts(getDevices());

  deviceEvents.emit("update", { devices: getDevices() });

  for (const alert of newAlerts) {
    deviceEvents.emit("newAlert", alert);
  }
}

let simulationHandle: ReturnType<typeof setInterval> | undefined;

export function startSimulation(): void {
  if (simulationHandle) return;
  // Run one alert pass immediately so /alerts is populated before the first tick.
  refreshAlerts(getDevices());
  simulationHandle = setInterval(tick, SIMULATION_INTERVAL_MS);
  logger.info(
    { intervalMs: SIMULATION_INTERVAL_MS },
    "Device simulation started",
  );
}
