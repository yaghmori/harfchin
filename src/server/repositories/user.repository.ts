import { prisma } from "@/lib/prisma";

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createGuestUser() {
  return prisma.user.create({
    data: { isGuest: true },
  });
}

export async function updateUserName(userId: string, name: string | null) {
  return prisma.user.update({
    where: { id: userId },
    data: { name },
  });
}

export async function updateUserPasswordHash(userId: string, passwordHash: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function deactivateUserAccount(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      isGuest: true,
      email: null,
      passwordHash: null,
      name: "کاربر حذف‌شده",
    },
  });
}

export async function searchRegisteredUsers(params: {
  query?: string;
  excludeUserIds: string[];
  take: number;
}) {
  const q = params.query?.trim();
  return prisma.user.findMany({
    where: {
      isGuest: false,
      passwordHash: { not: null },
      id: { notIn: params.excludeUserIds },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: params.take,
  });
}
