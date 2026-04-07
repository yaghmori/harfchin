import { jsonOk, handleRouteError } from "@/lib/api-response";
import { roomCodeBodySchema } from "@/lib/validation/room";
import { getOrCreateSessionUserId } from "@/server/session";
import * as scoringService from "@/server/services/scoring.service";

export async function POST(req: Request) {
  try {
    const body = roomCodeBodySchema.parse(await req.json());
    const userId = await getOrCreateSessionUserId();
    const data = await scoringService.scoreCurrentRound(body.roomCode, userId);
    return jsonOk(data);
  } catch (e) {
    return handleRouteError(e);
  }
}
