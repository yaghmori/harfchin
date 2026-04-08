import { jsonOk, handleRouteError } from "@/lib/api-response";
import { getSessionUser } from "@/server/session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return jsonOk({ user: null });
    }
    const registered = Boolean(user.email && !user.isGuest);
    return jsonOk({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isGuest: user.isGuest,
        createdAt: user.createdAt,
        isRegistered: registered,
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
