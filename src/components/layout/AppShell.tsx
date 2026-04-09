import {
  AppBottomNav,
  type BottomNavAccountTab,
} from "@/components/layout/AppBottomNav";
import { AppTopBar } from "@/components/layout/AppTopBar";
import type { ShellAuthMode } from "@/components/layout/shell-auth";

type AppShellProps = {
  children: React.ReactNode;
  authMode: ShellAuthMode;
  bottomNavAccount?: BottomNavAccountTab;
  /** Shown in the top bar when the user has a registered account. */
  topBarCoins?: number;
};

export function AppShell({
  children,
  authMode,
  bottomNavAccount,
  topBarCoins,
}: AppShellProps) {
  return (
    <div className="app-shell flex min-h-dvh flex-col bg-background" dir="rtl">
      <AppTopBar authMode={authMode} coins={topBarCoins} />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-24 pb-28 sm:max-w-3xl sm:pb-24 sm:pt-25">
        {children}
      </main>
      <AppBottomNav account={bottomNavAccount} />
    </div>
  );
}
