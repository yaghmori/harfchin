import { jsonOk, handleRouteError } from "@/lib/api-response";
import { inviteFriendBodySchema } from "@/lib/validation/room";
import { requireRegisteredUserId } from "@/server/session";
import * as roomService from "@/server/services/room.service";

export async function POST(req: Request) {
  try {
    const body = inviteFriendBodySchema.parse(await req.json());
    const userId = await requireRegisteredUserId();
    const data = await roomService.inviteFriendToRoom({
      userId,
      roomCode: body.roomCode,
      friendUserId: body.friendUserId,
    });
    return jsonOk(data);
  } catch (e) {
    return handleRouteError(e);
  }
}
