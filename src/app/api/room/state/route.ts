import { jsonOk, handleRouteError } from "@/lib/api-response";
import { roomCodeSchema } from "@/lib/validation/room";
import * as roomService from "@/server/services/room.service";
import { getOrCreateSessionUserId } from "@/server/session";

export async function GET(req: Request) {
  try {
    const code = new URL(req.url).searchParams.get("code");
    const roomCode = roomCodeSchema.parse(code ?? "");
    const meUserId = await getOrCreateSessionUserId();
    const data = await roomService.getRoomState(roomCode, meUserId);
    return jsonOk({ ...data, meUserId });
  } catch (e) {
    return handleRouteError(e);
  }
}
