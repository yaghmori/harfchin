import { jsonOk, handleRouteError } from "@/lib/api-response";
import { roomCodeBodySchema } from "@/lib/validation/room";
import { getOrCreateSessionUserId } from "@/server/session";
import * as roomService from "@/server/services/room.service";

export async function POST(req: Request) {
  try {
    const body = roomCodeBodySchema.parse(await req.json());
    const userId = await getOrCreateSessionUserId();
    await roomService.deleteRoomByHost({ userId, roomCode: body.roomCode });
    return jsonOk({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
