import {
  AppBottomNav,
  type BottomNavAccountTab,
} from "@/components/layout/AppBottomNav";
import { AppTopBar } from "@/components/layout/AppTopBar";
import type { ShellAuthMode } from "@/components/layout/shell-auth";

type AppShellProps = {
  children: React.ReactNode;
  authMode: ShellAuthMode;
  userInitial: string;
  bottomNavAccount?: BottomNavAccountTab;
};

export function AppShell({
  children,
  authMode,
  userInitial,
  bottomNavAccount,
}: AppShellProps) {
  return (
    <div
      className="app-shell game-surface flex min-h-dvh flex-col"
      dir="rtl"
    >
      <AppTopBar authMode={authMode} userInitial={userInitial} />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-[6rem] pb-28 sm:max-w-3xl sm:pb-24 sm:pt-[6.25rem]">
        {children}
      </main>
      <AppBottomNav account={bottomNavAccount} />
    </div>
  );
}
