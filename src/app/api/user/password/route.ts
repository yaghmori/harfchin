import { jsonOk, handleRouteError } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { changePasswordBodySchema } from "@/lib/validation/profile";
import { hashPassword } from "@/server/auth-password";
import * as userRepo from "@/server/repositories/user.repository";
import { requireRegisteredUserId } from "@/server/session";

export async function PATCH(req: Request) {
  try {
    const userId = await requireRegisteredUserId();
    const body = changePasswordBodySchema.parse(await req.json());
    const user = await userRepo.findUserById(userId);

    if (!user || user.isGuest) {
      throw new AppError("FORBIDDEN", "برای ادامه وارد شوید.", { status: 401 });
    }

    const newHash = await hashPassword(body.newPassword);
    await userRepo.updateUserPasswordHash(userId, newHash);

    return jsonOk({ success: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
