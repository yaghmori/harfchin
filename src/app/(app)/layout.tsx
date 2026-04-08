import { AppShell } from "@/components/layout/AppShell";
import { getSessionUser } from "@/server/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const isRegistered = Boolean(
    user?.email && !user.isGuest && user.passwordHash,
  );
  const displayName = user?.name?.trim() ?? "";
  const userInitial =
    displayName.length > 0
      ? displayName.charAt(0)
      : user
        ? "ب"
        : "?";

  return (
    <AppShell
      profileHref={isRegistered ? "/profile" : "/login"}
      userInitial={userInitial}
    >
      {children}
    </AppShell>
  );
}
