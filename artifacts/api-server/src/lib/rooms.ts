export type RoomId = "drawing_room" | "work_room_1" | "work_room_2";
export type DeviceType = "fan" | "light";

export const ROOMS: { id: RoomId; label: string }[] = [
  { id: "drawing_room", label: "Drawing Room" },
  { id: "work_room_1", label: "Work Room 1" },
  { id: "work_room_2", label: "Work Room 2" },
];

export const ROOM_LABELS: Record<RoomId, string> = {
  drawing_room: "Drawing Room",
  work_room_1: "Work Room 1",
  work_room_2: "Work Room 2",
};

const ROOM_ALIASES: Record<string, RoomId> = {
  drawing_room: "drawing_room",
  drawing: "drawing_room",
  "drawing-room": "drawing_room",
  "drawingroom": "drawing_room",
  work_room_1: "work_room_1",
  work1: "work_room_1",
  "work-room-1": "work_room_1",
  "workroom1": "work_room_1",
  "work room 1": "work_room_1",
  work_room_2: "work_room_2",
  work2: "work_room_2",
  "work-room-2": "work_room_2",
  "workroom2": "work_room_2",
  "work room 2": "work_room_2",
};

export function resolveRoomId(input: string): RoomId | undefined {
  const key = input.trim().toLowerCase();
  return ROOM_ALIASES[key];
}

export function isRoomId(value: string): value is RoomId {
  return ROOMS.some((room) => room.id === value);
}
