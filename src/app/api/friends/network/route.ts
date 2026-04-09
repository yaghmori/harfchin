import { jsonOk, handleRouteError } from "@/lib/api-response";
import { requireRegisteredUserId } from "@/server/session";
import * as friendshipService from "@/server/services/friendship.service";

export async function GET() {
  try {
    const userId = await requireRegisteredUserId();
    const data = await friendshipService.listFriendNetwork(userId);
    return jsonOk(data);
  } catch (e) {
    return handleRouteError(e);
  }
}
