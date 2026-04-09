import { AppShell } from "@/components/layout/AppShell";
import { resolveShellAuthMode } from "@/components/layout/shell-auth";
import { getUserShopBalance } from "@/server/services/coin-shop.service";
import { getProfileForUser } from "@/server/services/profile.service";
import { getSessionUser } from "@/server/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const authMode = resolveShellAuthMode(user);

  const profile =
    authMode === "registered" && user
      ? await getProfileForUser(user.id)
      : null;
  const topBarCoins =
    profile != null && user
      ? await getUserShopBalance(user.id, profile.totalScore)
      : undefined;

  const bottomNavAccount =
    authMode === "registered"
      ? {
          href: "/profile",
          label: "پروفایل",
          variant: "profile" as const,
          prefixes: ["/profile"] as const,
        }
      : undefined;

  return (
    <AppShell
      authMode={authMode}
      bottomNavAccount={bottomNavAccount}
      topBarCoins={topBarCoins}
    >
      {children}
    </AppShell>
  );
}
