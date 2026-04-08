import { jsonOk, handleRouteError } from "@/lib/api-response";
import * as roomService from "@/server/services/room.service";

export async function GET() {
  try {
    const rooms = await roomService.listRoomsForDirectory();
    return jsonOk({ rooms });
  } catch (e) {
    return handleRouteError(e);
  }
}
