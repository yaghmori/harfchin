import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories: { key: string; title: string; sortOrder: number }[] = [
  { key: "first_name", title: "اسم", sortOrder: 1 },
  { key: "last_name", title: "فامیل", sortOrder: 2 },
  { key: "city", title: "شهر", sortOrder: 3 },
  { key: "country", title: "کشور", sortOrder: 4 },
  { key: "food", title: "غذا", sortOrder: 5 },
  { key: "animal", title: "حیوان", sortOrder: 6 },
];

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({
      where: { key: c.key },
      create: {
        key: c.key,
        title: c.title,
        sortOrder: c.sortOrder,
        isActive: true,
      },
      update: {
        title: c.title,
        sortOrder: c.sortOrder,
        isActive: true,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
