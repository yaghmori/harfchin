import { jsonOk, handleRouteError } from "@/lib/api-response";
import { roomCodeBodySchema } from "@/lib/validation/room";
import { getOrCreateSessionUserId } from "@/server/session";
import * as gameService from "@/server/services/game.service";

export async function POST(req: Request) {
  try {
    const body = roomCodeBodySchema.parse(await req.json());
    const userId = await getOrCreateSessionUserId();
    const data = await gameService.nextRound({
      userId,
      roomCode: body.roomCode,
    });
    return jsonOk(data);
  } catch (e) {
    return handleRouteError(e);
  }
}
