import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "../src/generated/prisma/client";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
config({ path: resolve(root, ".env") });
config({ path: resolve(root, ".env.local"), override: true });

const prisma = new PrismaClient();

/** Stable UUIDs so categories stay consistent across environments (GUID-based seed). */
const categories: { id: string; key: string; title: string; sortOrder: number }[] = [
  { id: "c1000000-0000-4000-8000-000000000001", key: "first_name", title: "اسم", sortOrder: 1 },
  { id: "c1000000-0000-4000-8000-000000000002", key: "last_name", title: "فامیل", sortOrder: 2 },
  { id: "c1000000-0000-4000-8000-000000000003", key: "city", title: "شهر", sortOrder: 3 },
  { id: "c1000000-0000-4000-8000-000000000004", key: "country", title: "کشور", sortOrder: 4 },
  { id: "c1000000-0000-4000-8000-000000000005", key: "food", title: "غذا", sortOrder: 5 },
  { id: "c1000000-0000-4000-8000-000000000006", key: "animal", title: "حیوان", sortOrder: 6 },
  { id: "c1000000-0000-4000-8000-000000000007", key: "body_parts", title: "اعضای بدن", sortOrder: 7 },
  { id: "c1000000-0000-4000-8000-000000000008", key: "objects", title: "اشیا", sortOrder: 8 },
  { id: "c1000000-0000-4000-8000-000000000009", key: "occupation", title: "شغل", sortOrder: 9 },
  { id: "c1000000-0000-4000-8000-00000000000a", key: "vehicle", title: "ماشین", sortOrder: 10 },
  { id: "c1000000-0000-4000-8000-00000000000b", key: "fruit", title: "میوه", sortOrder: 11 },
  { id: "c1000000-0000-4000-8000-00000000000c", key: "color", title: "رنگ", sortOrder: 12 },
  { id: "c1000000-0000-4000-8000-00000000000d", key: "flower_plant", title: "گل و گیاه", sortOrder: 13 },
];

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({
      where: { key: c.key },
      create: {
        id: c.id,
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
