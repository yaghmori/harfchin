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
