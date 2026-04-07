import { jsonOk, handleRouteError } from "@/lib/api-response";
import { createRoomBodySchema } from "@/lib/validation/room";
import { getOrCreateSessionUserId } from "@/server/session";
import * as roomService from "@/server/services/room.service";

export async function POST(req: Request) {
  try {
    const body = createRoomBodySchema.parse(await req.json());
    const userId = await getOrCreateSessionUserId();
    const data = await roomService.createRoom({
      userId,
      displayName: body.displayName,
      maxPlayers: body.maxPlayers,
      draftTotalRounds: body.draftTotalRounds,
      draftRoundTimeSec: body.draftRoundTimeSec,
    });
    return jsonOk(data);
  } catch (e) {
    return handleRouteError(e);
  }
}
