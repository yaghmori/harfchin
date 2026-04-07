import { prisma } from "@/lib/prisma";

export async function listActiveCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function findCategoryByKey(key: string) {
  return prisma.category.findUnique({ where: { key } });
}
