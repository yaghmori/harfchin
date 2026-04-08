import { jsonOk, handleRouteError } from "@/lib/api-response";
import { gameStateQuerySchema } from "@/lib/validation/game";
import * as gameService from "@/server/services/game.service";
import * as playerRepo from "@/server/repositories/player.repository";
import * as roomRepo from "@/server/repositories/room.repository";
import { getOrCreateSessionUserId } from "@/server/session";

async function withMeRoomPlayer(
  roomCode: string | undefined,
  meUserId: string,
  data: Record<string, unknown>,
) {
  const code =
    roomCode ??
    (typeof data.roomCode === "string" ? data.roomCode : undefined);
  if (!code) {
    return { ...data, meUserId, meRoomPlayerId: null as string | null };
  }
  const room = await roomRepo.findRoomByCode(code);
  if (!room) {
    return { ...data, meUserId, meRoomPlayerId: null };
  }
  const rp = await playerRepo.findRoomPlayer(room.id, meUserId);
  return { ...data, meUserId, meRoomPlayerId: rp?.id ?? null };
}

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
      return jsonOk(
        await withMeRoomPlayer(undefined, meUserId, {
          ...data,
        } as Record<string, unknown>),
      );
    }
    const data = await gameService.getGameStateByRoomCode(q.roomCode!);
    return jsonOk(
      await withMeRoomPlayer(q.roomCode!, meUserId, {
        ...data,
      } as Record<string, unknown>),
    );
  } catch (e) {
    return handleRouteError(e);
  }
}
