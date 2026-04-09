import { jsonOk, handleRouteError } from "@/lib/api-response";
import { loginBodySchema } from "@/lib/validation/auth";
import * as authService from "@/server/services/auth.service";
import { setSessionUserId } from "@/server/session";

export async function POST(req: Request) {
  try {
    const body = loginBodySchema.parse(await req.json());
    const user = await authService.authenticateUser(
      body.identifier,
      body.password,
    );
    await setSessionUserId(user.id);
    return jsonOk({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isGuest: user.isGuest,
        createdAt: user.createdAt,
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
