import { jsonOk, handleRouteError, jsonErr } from "@/lib/api-response";
import { updateProfileBodySchema } from "@/lib/validation/profile";
import { requireRegisteredUserId } from "@/server/session";
import * as userRepo from "@/server/repositories/user.repository";
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

export async function PATCH(req: Request) {
  try {
    const userId = await requireRegisteredUserId();
    const body = updateProfileBodySchema.parse(await req.json());
    await userRepo.updateUserName(userId, body.name);
    const profile = await getProfileForUser(userId);
    if (!profile) {
      return jsonErr("NOT_FOUND", "پروفایل یافت نشد.", 404);
    }
    return jsonOk(profile);
  } catch (e) {
    return handleRouteError(e);
  }
}
