import { resolveShellAuthMode } from "@/components/layout/shell-auth";
import { CoinShopView } from "@/components/shop/CoinShopView";
import {
  getUserShopBalance,
  listActiveCoinPackages,
} from "@/server/services/coin-shop.service";
import { getProfileForUser } from "@/server/services/profile.service";
import { getSessionUser } from "@/server/session";

export const metadata = {
  title: "فروشگاه سکه",
};

export default async function ShopPage() {
  const user = await getSessionUser();
  const authMode = resolveShellAuthMode(user);

  let balance = 100;
  if (authMode === "registered" && user) {
    const profile = await getProfileForUser(user.id);
    if (profile) {
      balance = await getUserShopBalance(user.id, profile.totalScore);
    }
  }

  const packages = await listActiveCoinPackages();

  return <CoinShopView balance={balance} packages={packages} />;
}
