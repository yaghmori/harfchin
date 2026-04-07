import { jsonOk, handleRouteError } from "@/lib/api-response";
import { readyBodySchema } from "@/lib/validation/room";
import { getOrCreateSessionUserId } from "@/server/session";
import * as roomService from "@/server/services/room.service";

export async function POST(req: Request) {
  try {
    const body = readyBodySchema.parse(await req.json());
    const userId = await getOrCreateSessionUserId();
    await roomService.setReady({
      userId,
      roomCode: body.roomCode,
      isReady: body.isReady,
    });
    return jsonOk({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
