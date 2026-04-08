import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/server/auth-password";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function registerUser(input: {
  email: string;
  password: string;
  name: string;
}) {
  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("CONFLICT", "این ایمیل قبلاً ثبت شده است.");
  }

  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: {
      email,
      name: input.name.trim(),
      passwordHash,
      isGuest: false,
    },
    select: {
      id: true,
      email: true,
      name: true,
      isGuest: true,
      createdAt: true,
    },
  });
}

export async function authenticateUser(email: string, password: string) {
  const row = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });
  if (!row?.passwordHash) {
    throw new AppError("FORBIDDEN", "ایمیل یا رمز عبور اشتباه است.", {
      status: 401,
    });
  }
  const ok = await verifyPassword(password, row.passwordHash);
  if (!ok) {
    throw new AppError("FORBIDDEN", "ایمیل یا رمز عبور اشتباه است.", {
      status: 401,
    });
  }
  return row;
}
