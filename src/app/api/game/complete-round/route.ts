import { jsonOk, handleRouteError } from "@/lib/api-response";
import { completeRoundSchema } from "@/lib/validation/game";
import { getOrCreateSessionUserId } from "@/server/session";
import * as gameService from "@/server/services/game.service";

export async function POST(req: Request) {
  try {
    const body = completeRoundSchema.parse(await req.json());
    const userId = await getOrCreateSessionUserId();
    const data = await gameService.completeRound({
      userId,
      roomCode: body.roomCode,
      answers: body.answers,
    });
    return jsonOk(data);
  } catch (e) {
    return handleRouteError(e);
  }
}
