import { jsonOk, handleRouteError } from "@/lib/api-response";
import { roomCodeSchema } from "@/lib/validation/room";
import { requireRegisteredUserId } from "@/server/session";
import * as roomService from "@/server/services/room.service";

export async function GET(req: Request) {
  try {
    const code = new URL(req.url).searchParams.get("roomCode");
    const roomCode = roomCodeSchema.parse(code ?? "");
    const userId = await requireRegisteredUserId();
    const data = await roomService.listInvitableFriends({ userId, roomCode });
    return jsonOk(data);
  } catch (e) {
    return handleRouteError(e);
  }
}
