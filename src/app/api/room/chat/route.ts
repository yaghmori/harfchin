import { jsonOk, handleRouteError } from "@/lib/api-response";
import { roomCodeSchema, roomChatPostBodySchema } from "@/lib/validation/room";
import { getOrCreateSessionUserId } from "@/server/session";
import * as roomService from "@/server/services/room.service";

export async function GET(req: Request) {
  try {
    const code = new URL(req.url).searchParams.get("code");
    const roomCode = roomCodeSchema.parse(code ?? "");
    const userId = await getOrCreateSessionUserId();
    const messages = await roomService.listRoomChat({ userId, roomCode });
    return jsonOk({ messages });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = roomChatPostBodySchema.parse(await req.json());
    const userId = await getOrCreateSessionUserId();
    await roomService.postRoomChat({
      userId,
      roomCode: body.roomCode,
      body: body.body,
    });
    return jsonOk({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
