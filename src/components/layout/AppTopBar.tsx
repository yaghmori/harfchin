import { Button } from "@/components/ui/button";
import { AppUserMenu } from "@/components/layout/AppUserMenu";
import type { ShellAuthMode } from "@/components/layout/shell-auth";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export type AppTopBarProps = {
  authMode: ShellAuthMode;
  userInitial: string;
};

function AppLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 text-center",
        className,
      )}
    >
      <span
        className="font-heading text-2xl font-black tracking-tight text-[#7E3AF2] sm:text-3xl dark:text-violet-400"
        style={{ textShadow: "0 1px 0 rgb(255 255 255 / 0.4)" }}
      >
        حرفچی
      </span>
      <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600/70 sm:block dark:text-violet-400/70">
        اسم‌وفامیل
      </span>
    </div>
  );
}

export function AppTopBar({ authMode, userInitial }: AppTopBarProps) {
  const isRegistered = authMode === "registered";

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 min-h-[4rem] border-b border-violet-200/40 bg-card/90 py-3 shadow-[var(--game-shadow-sm)] backdrop-blur-md dark:border-violet-900/35 dark:bg-zinc-950/90"
      dir="rtl"
    >
      <div className="mx-auto flex min-h-[3.25rem] max-w-lg items-center px-4 sm:max-w-3xl">
        {isRegistered ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="relative z-10 shrink-0 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              aria-label="اعلان‌ها"
              disabled
            >
              <Bell className="size-5" aria-hidden />
            </Button>

            <div className="pointer-events-none absolute inset-x-0 flex items-center justify-center">
              <AppLogo />
            </div>

            <div className="relative z-10 ms-auto shrink-0">
              <AppUserMenu mode={authMode} userInitial={userInitial} />
            </div>
          </>
        ) : (
          <div className="flex w-full justify-center py-0.5">
            <AppLogo />
          </div>
        )}
      </div>
    </header>
  );
}
