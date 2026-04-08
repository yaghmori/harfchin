import { roomCodeSchema } from "@/lib/validation/room";
import * as roomRepo from "@/server/repositories/room.repository";
import {
  roomEventChannel,
  subscribeRoomUpdates,
} from "@/server/realtime/room-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sseResponse(stream: ReadableStream<Uint8Array>) {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function GET(req: Request) {
  const codeRaw = new URL(req.url).searchParams.get("code");
  let roomCode: string;
  try {
    roomCode = roomCodeSchema.parse(codeRaw ?? "");
  } catch {
    return new Response("Invalid room code", { status: 400 });
  }

  const room = await roomRepo.findRoomByCode(roomCode);
  if (!room) {
    return new Response("Not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  const ch = roomEventChannel(room.code);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (line: string) => {
        try {
          controller.enqueue(encoder.encode(line));
        } catch {
          /* stream closed */
        }
      };

      send(`data: ${JSON.stringify({ type: "hello", channel: ch })}\n\n`);

      const push = () => {
        send(`data: ${JSON.stringify({ type: "update" })}\n\n`);
      };

      const unsubscribe = subscribeRoomUpdates(room.code, push);

      const ping = setInterval(() => {
        send(": ping\n\n");
      }, 25_000);

      const close = () => {
        clearInterval(ping);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      req.signal.addEventListener("abort", close, { once: true });
    },
  });

  return sseResponse(stream);
}
