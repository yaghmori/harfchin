import { jsonOk, handleRouteError } from "@/lib/api-response";
import { clearSessionUserCookie } from "@/server/session";

export async function POST() {
  try {
    await clearSessionUserCookie();
    return jsonOk({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
