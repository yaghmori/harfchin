import { jsonOk, handleRouteError } from "@/lib/api-response";
import { joinRoomBodySchema } from "@/lib/validation/room";
import { getOrCreateSessionUserId } from "@/server/session";
import * as roomService from "@/server/services/room.service";

export async function POST(req: Request) {
  try {
    const body = joinRoomBodySchema.parse(await req.json());
    const userId = await getOrCreateSessionUserId();
    const data = await roomService.joinRoom({
      userId,
      roomCode: body.roomCode,
      displayName: body.displayName,
    });
    return jsonOk(data);
  } catch (e) {
    return handleRouteError(e);
  }
}
