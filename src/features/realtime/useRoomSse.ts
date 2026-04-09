"use client";

import { useEffect, useRef } from "react";
import { API_ENDPOINTS } from "@/features/api/endpoints";

/**
 * Subscribes to room-scoped SSE; calls onEvent when the server signals an update.
 * Falls back to nothing if EventSource is unavailable.
 */
export function useRoomSse(roomCode: string, onEvent: () => void) {
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (typeof EventSource === "undefined") return;

    const code = roomCode.trim().toUpperCase();
    const url = API_ENDPOINTS.realtime.room(code);
    const es = new EventSource(url);

    es.onmessage = (ev) => {
      try {
        const p = JSON.parse(ev.data as string) as { type?: string };
        if (p.type === "hello") return;
      } catch {
        /* non-JSON payload: still refresh */
      }
      onEventRef.current();
    };

    return () => {
      es.close();
    };
  }, [roomCode]);
}
