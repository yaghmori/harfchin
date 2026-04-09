import { jsonOk, handleRouteError } from "@/lib/api-response";
import { requireRegisteredUserId } from "@/server/session";
import * as roomService from "@/server/services/room.service";

export async function GET() {
  try {
    const userId = await requireRegisteredUserId();
    const data = await roomService.listIncomingRoomInvites(userId);
    return jsonOk(data);
  } catch (e) {
    return handleRouteError(e);
  }
}
