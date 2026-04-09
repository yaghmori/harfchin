import { jsonOk, handleRouteError } from "@/lib/api-response";
import { respondRoomInviteBodySchema } from "@/lib/validation/room";
import { requireRegisteredUserId } from "@/server/session";
import * as roomService from "@/server/services/room.service";

export async function POST(req: Request) {
  try {
    const userId = await requireRegisteredUserId();
    const body = respondRoomInviteBodySchema.parse(await req.json());
    const data = await roomService.respondRoomInvite({
      userId,
      inviteId: body.inviteId,
      action: body.action,
      displayName: body.displayName,
    });
    return jsonOk(data);
  } catch (e) {
    return handleRouteError(e);
  }
}
