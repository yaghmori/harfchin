import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "../src/generated/prisma";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
config({ path: resolve(root, ".env") });
config({ path: resolve(root, ".env.local"), override: true });

const prisma = new PrismaClient();

const DEFAULT_POINTS = {
  pointsSoloBonus: 20,
  pointsUnique: 10,
  pointsDuplicate: 5,
} as const;

type CategorySeed = {
  id: string;
  key: string;
  title: string;
  sortOrder: number;
  pointsSoloBonus: number;
  pointsUnique: number;
  pointsDuplicate: number;
};

/** Build a category row: stable id/key/title/order plus scoring (override any point field when needed). */
function category(
  row: {
    id: string;
    key: string;
    title: string;
    sortOrder: number;
  } & Partial<typeof DEFAULT_POINTS>,
): CategorySeed {
  return { ...DEFAULT_POINTS, ...row };
}

/**
 * Full category catalog — GUID ids are stable across environments.
 * Core + extra (اعضای بدن، اشیا، شغل، ماشین، میوه، رنگ، گل و گیاه).
 */
const categories: CategorySeed[] = [
  category({
    id: "c1000000-0000-4000-8000-000000000001",
    key: "first_name",
    title: "اسم",
    sortOrder: 1,
  }),
  category({
    id: "c1000000-0000-4000-8000-000000000002",
    key: "last_name",
    title: "فامیل",
    sortOrder: 2,
  }),
  category({
    id: "c1000000-0000-4000-8000-000000000003",
    key: "city",
    title: "شهر",
    sortOrder: 3,
  }),
  category({
    id: "c1000000-0000-4000-8000-000000000004",
    key: "country",
    title: "کشور",
    sortOrder: 4,
  }),
  category({
    id: "c1000000-0000-4000-8000-000000000005",
    key: "food",
    title: "غذا",
    sortOrder: 5,
  }),
  category({
    id: "c1000000-0000-4000-8000-000000000006",
    key: "animal",
    title: "حیوان",
    sortOrder: 6,
  }),
  category({
    id: "c1000000-0000-4000-8000-000000000007",
    key: "body_parts",
    title: "اعضای بدن",
    sortOrder: 7,
  }),
  category({
    id: "c1000000-0000-4000-8000-000000000008",
    key: "objects",
    title: "اشیا",
    sortOrder: 8,
  }),
  category({
    id: "c1000000-0000-4000-8000-000000000009",
    key: "occupation",
    title: "شغل",
    sortOrder: 9,
  }),
  category({
    id: "c1000000-0000-4000-8000-00000000000a",
    key: "vehicle",
    title: "ماشین",
    sortOrder: 10,
  }),
  category({
    id: "c1000000-0000-4000-8000-00000000000b",
    key: "fruit",
    title: "میوه",
    sortOrder: 11,
  }),
  category({
    id: "c1000000-0000-4000-8000-00000000000c",
    key: "color",
    title: "رنگ",
    sortOrder: 12,
  }),
  category({
    id: "c1000000-0000-4000-8000-00000000000d",
    key: "flower_plant",
    title: "گل و گیاه",
    sortOrder: 13,
  }),
];

async function main() {
  await prisma.$transaction(
    categories.map((c) =>
      prisma.category.upsert({
        where: { key: c.key },
        create: {
          id: c.id,
          key: c.key,
          title: c.title,
          sortOrder: c.sortOrder,
          isActive: true,
          pointsSoloBonus: c.pointsSoloBonus,
          pointsUnique: c.pointsUnique,
          pointsDuplicate: c.pointsDuplicate,
        },
        update: {
          title: c.title,
          sortOrder: c.sortOrder,
          isActive: true,
          pointsSoloBonus: c.pointsSoloBonus,
          pointsUnique: c.pointsUnique,
          pointsDuplicate: c.pointsDuplicate,
        },
      }),
    ),
  );

  console.log(
    `Seeded ${categories.length} categories.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
