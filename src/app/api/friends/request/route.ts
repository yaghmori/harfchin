import { jsonOk, handleRouteError } from "@/lib/api-response";
import { friendUserIdBodySchema } from "@/lib/validation/friends";
import { requireRegisteredUserId } from "@/server/session";
import * as friendshipService from "@/server/services/friendship.service";

export async function POST(req: Request) {
  try {
    const userId = await requireRegisteredUserId();
    const body = friendUserIdBodySchema.parse(await req.json());
    const data = await friendshipService.sendFriendRequest({
      userId,
      targetUserId: body.targetUserId,
    });
    return jsonOk(data);
  } catch (e) {
    return handleRouteError(e);
  }
}
