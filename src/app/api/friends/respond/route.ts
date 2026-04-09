import { jsonOk, handleRouteError } from "@/lib/api-response";
import { friendRespondBodySchema } from "@/lib/validation/friends";
import { requireRegisteredUserId } from "@/server/session";
import * as friendshipService from "@/server/services/friendship.service";

export async function POST(req: Request) {
  try {
    const userId = await requireRegisteredUserId();
    const body = friendRespondBodySchema.parse(await req.json());
    const data = await friendshipService.respondFriendRequest({
      userId,
      friendshipId: body.friendshipId,
      action: body.action,
    });
    return jsonOk(data);
  } catch (e) {
    return handleRouteError(e);
  }
}
