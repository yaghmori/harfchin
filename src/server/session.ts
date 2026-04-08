import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { COOKIE_USER_ID } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import type { User } from "@/generated/prisma";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 400;

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
    secure: process.env.NODE_ENV === "production",
  };
}

/**
 * User row for the current cookie, if valid. Does not create a guest.
 */
export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const id = jar.get(COOKIE_USER_ID)?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export async function setSessionUserId(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_USER_ID, userId, sessionCookieOptions());
}

export async function clearSessionUserCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_USER_ID);
}

/**
 * Registered (non-guest) user id or throws 401.
 */
export async function requireRegisteredUserId(): Promise<string> {
  const user = await getSessionUser();
  if (!user?.email || user.isGuest || !user.passwordHash) {
    throw new AppError("FORBIDDEN", "برای ادامه وارد شوید.", {
      status: 401,
    });
  }
  return user.id;
}

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

  jar.set(COOKIE_USER_ID, user.id, sessionCookieOptions());

  return user.id;
}
