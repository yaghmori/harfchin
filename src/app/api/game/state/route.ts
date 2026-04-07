import { jsonOk, handleRouteError } from "@/lib/api-response";
import { gameStateQuerySchema } from "@/lib/validation/game";
import * as gameService from "@/server/services/game.service";
import { getOrCreateSessionUserId } from "@/server/session";

export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const q = gameStateQuerySchema.parse({
      roomCode: sp.get("roomCode") ?? undefined,
      gameId: sp.get("gameId") ?? undefined,
    });
    const meUserId = await getOrCreateSessionUserId();
    if (q.gameId) {
      const data = await gameService.getGameStateByGameId(q.gameId);
      return jsonOk({ ...data, meUserId });
    }
    const data = await gameService.getGameStateByRoomCode(q.roomCode!);
    return jsonOk({ ...data, meUserId });
  } catch (e) {
    return handleRouteError(e);
  }
}
