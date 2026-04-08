import { jsonOk, handleRouteError } from "@/lib/api-response";
import { signupBodySchema } from "@/lib/validation/auth";
import * as authService from "@/server/services/auth.service";
import { setSessionUserId } from "@/server/session";

export async function POST(req: Request) {
  try {
    const body = signupBodySchema.parse(await req.json());
    const user = await authService.registerUser({
      email: body.email,
      password: body.password,
      name: body.name,
    });
    await setSessionUserId(user.id);
    return jsonOk({ user });
  } catch (e) {
    return handleRouteError(e);
  }
}
