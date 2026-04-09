import { jsonOk, handleRouteError } from "@/lib/api-response";
import { requireRegisteredUserId } from "@/server/session";
import * as friendshipService from "@/server/services/friendship.service";

export async function GET(req: Request) {
  try {
    const userId = await requireRegisteredUserId();
    const q = new URL(req.url).searchParams.get("q") ?? "";
    const data = await friendshipService.discoverUsers({ userId, q });
    return jsonOk(data);
  } catch (e) {
    return handleRouteError(e);
  }
}
