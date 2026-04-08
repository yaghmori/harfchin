import { AppBottomNav } from "@/components/layout/AppBottomNav";
import { AppTopBar, type AppTopBarProps } from "@/components/layout/AppTopBar";

type AppShellProps = AppTopBarProps & {
  children: React.ReactNode;
};

export function AppShell({
  children,
  profileHref,
  userInitial,
}: AppShellProps) {
  return (
    <div
      className="app-shell game-surface flex min-h-dvh flex-col"
      dir="rtl"
    >
      <AppTopBar profileHref={profileHref} userInitial={userInitial} />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-[4.75rem] pb-28 sm:max-w-3xl sm:pb-24">
        {children}
      </main>
      <AppBottomNav />
    </div>
  );
}
