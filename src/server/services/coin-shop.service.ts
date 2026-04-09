import { prisma } from "@/lib/prisma";

export type ShopPackageRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  coinAmount: number;
  bonusAmount: number;
  priceTomans: number;
  currencyLabel: string;
  imageUrl: string;
  badgeText: string | null;
  isFeatured: boolean;
};

/**
 * Catalog rows for the coin shop. Uses raw SQL so a stale generated client
 * (before `pnpm db:generate`) still works once the table exists.
 */
export async function listActiveCoinPackages(): Promise<ShopPackageRow[]> {
  const rows = await prisma.$queryRaw<ShopPackageRow[]>`
    SELECT
      id::text AS id,
      slug,
      title,
      description,
      "coinAmount",
      "bonusAmount",
      "priceTomans",
      "currencyLabel",
      "imageUrl",
      "badgeText",
      "isFeatured"
    FROM "CoinPackage"
    WHERE "isActive" = true
    ORDER BY "sortOrder" ASC
  `;
  return rows;
}

/** Wallet balance when present; otherwise same display rule as the app shell. */
export async function getUserShopBalance(
  userId: string,
  profileTotalScore: number,
): Promise<number> {
  const wallet = await prisma.userCoinWallet.findUnique({
    where: { userId },
    select: { balance: true },
  });
  if (wallet !== null) return wallet.balance;
  return Math.max(100, profileTotalScore * 3);
}
