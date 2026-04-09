import { jsonOk, handleRouteError } from "@/lib/api-response";
import * as userRepo from "@/server/repositories/user.repository";
import { clearSessionUserCookie, requireRegisteredUserId } from "@/server/session";

export async function DELETE() {
  try {
    const userId = await requireRegisteredUserId();
    await userRepo.deactivateUserAccount(userId);
    await clearSessionUserCookie();
    return jsonOk({ success: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
