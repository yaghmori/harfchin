import { jsonOk, handleRouteError } from "@/lib/api-response";
import { settingsBodySchema } from "@/lib/validation/room";
import { getOrCreateSessionUserId } from "@/server/session";
import * as roomService from "@/server/services/room.service";

export async function POST(req: Request) {
  try {
    const body = settingsBodySchema.parse(await req.json());
    const userId = await getOrCreateSessionUserId();
    await roomService.updateRoomSettings({
      userId,
      roomCode: body.roomCode,
      draftTotalRounds: body.draftTotalRounds,
      draftRoundTimeSec: body.draftRoundTimeSec,
      maxPlayers: body.maxPlayers,
    });
    return jsonOk({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
