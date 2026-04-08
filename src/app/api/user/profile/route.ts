import { jsonOk, handleRouteError, jsonErr } from "@/lib/api-response";
import { requireRegisteredUserId } from "@/server/session";
import { getProfileForUser } from "@/server/services/profile.service";

export async function GET() {
  try {
    const userId = await requireRegisteredUserId();
    const profile = await getProfileForUser(userId);
    if (!profile) {
      return jsonErr("NOT_FOUND", "پروفایل یافت نشد.", 404);
    }
    return jsonOk(profile);
  } catch (e) {
    return handleRouteError(e);
  }
}
