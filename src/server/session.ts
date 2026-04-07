import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { COOKIE_USER_ID } from "@/lib/constants";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 400;

/**
 * Resolves the current browser user (guest). Sets httpOnly cookie when missing.
 */
export async function getOrCreateSessionUserId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE_USER_ID)?.value;
  if (existing) {
    const user = await prisma.user.findUnique({ where: { id: existing } });
    if (user) return user.id;
  }

  const user = await prisma.user.create({
    data: { isGuest: true },
  });

  jar.set(COOKIE_USER_ID, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
    secure: process.env.NODE_ENV === "production",
  });

  return user.id;
}
