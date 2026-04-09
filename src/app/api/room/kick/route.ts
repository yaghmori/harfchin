import { jsonOk, handleRouteError } from "@/lib/api-response";
import { kickPlayerBodySchema } from "@/lib/validation/room";
import { getOrCreateSessionUserId } from "@/server/session";
import * as roomService from "@/server/services/room.service";

export async function POST(req: Request) {
  try {
    const body = kickPlayerBodySchema.parse(await req.json());
    const userId = await getOrCreateSessionUserId();
    await roomService.removePlayerByHost({
      hostUserId: userId,
      roomCode: body.roomCode,
      targetUserId: body.targetUserId,
    });
    return jsonOk({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
