import { EventEmitter } from "node:events";

const GLOBAL_KEY = "__harfchin_room_events__" as const;

function getEmitter(): EventEmitter {
  const g = globalThis as typeof globalThis & {
    [GLOBAL_KEY]?: EventEmitter;
  };
  if (!g[GLOBAL_KEY]) {
    const e = new EventEmitter();
    e.setMaxListeners(500);
    g[GLOBAL_KEY] = e;
  }
  return g[GLOBAL_KEY];
}

export function roomEventChannel(roomCode: string): string {
  return roomCode.trim().toUpperCase();
}

/** Notify all SSE subscribers for this room (same Node process only). */
export function emitRoomUpdate(roomCode: string): void {
  getEmitter().emit(roomEventChannel(roomCode));
}

export function subscribeRoomUpdates(
  roomCode: string,
  listener: () => void,
): () => void {
  const ch = roomEventChannel(roomCode);
  const bus = getEmitter();
  bus.on(ch, listener);
  return () => {
    bus.off(ch, listener);
  };
}
