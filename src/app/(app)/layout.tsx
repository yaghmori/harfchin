import { AppShell } from "@/components/layout/AppShell";
import { resolveShellAuthMode } from "@/components/layout/shell-auth";
import { getSessionUser } from "@/server/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const authMode = resolveShellAuthMode(user);

  const displayName = user?.name?.trim() ?? "";
  const userInitial =
    authMode === "anonymous"
      ? "?"
      : displayName.length > 0
        ? displayName.charAt(0)
        : authMode === "guest"
          ? "م"
          : user?.email?.charAt(0) ?? "?";

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
      userInitial={userInitial}
      bottomNavAccount={bottomNavAccount}
    >
      {children}
    </AppShell>
  );
}
