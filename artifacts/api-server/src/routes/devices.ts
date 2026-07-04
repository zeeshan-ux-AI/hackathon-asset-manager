import { Router, type IRouter, type Request, type Response } from "express";
import {
  ListDevicesResponse,
  GetRoomParams,
  GetRoomResponse,
  GetUsageResponse,
  ListAlertsResponse,
  UpdateDeviceParams,
  UpdateDeviceBody,
  UpdateDeviceResponse,
} from "@workspace/api-zod";
import {
  deviceEvents,
  getDevices,
  getRoomSummary,
  getUsageSummary,
  setDeviceState,
} from "../lib/deviceStore";
import { getActiveAlerts } from "../lib/alertsEngine";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/devices", (_req, res) => {
  const payload = ListDevicesResponse.parse({
    devices: getDevices(),
    generatedAt: new Date().toISOString(),
  });
  res.json(payload);
});

router.get("/rooms/:roomId", (req, res) => {
  const { roomId } = GetRoomParams.parse(req.params);
  const payload = GetRoomResponse.parse(getRoomSummary(roomId));
  res.json(payload);
});

router.get("/usage", (_req, res) => {
  const payload = GetUsageResponse.parse(getUsageSummary());
  res.json(payload);
});

router.get("/alerts", (_req, res) => {
  const payload = ListAlertsResponse.parse({
    alerts: getActiveAlerts(),
    generatedAt: new Date().toISOString(),
  });
  res.json(payload);
});

router.patch("/devices/:deviceId", (req, res) => {
  const { deviceId } = UpdateDeviceParams.parse(req.params);
  const { isOn } = UpdateDeviceBody.parse(req.body);

  const updated = setDeviceState(deviceId, isOn);
  if (!updated) {
    res.status(404).json({ error: `Device ${deviceId} not found` });
    return;
  }

  const payload = UpdateDeviceResponse.parse(updated);
  res.json(payload);
});

router.get("/events", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (event: string) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify({ generatedAt: new Date().toISOString() })}\n\n`);
  };

  send("connected");

  const onUpdate = () => send("update");
  deviceEvents.on("update", onUpdate);

  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    deviceEvents.off("update", onUpdate);
    logger.debug("SSE client disconnected");
  });
});

export default router;
