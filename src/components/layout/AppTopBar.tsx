import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type AppTopBarProps = {
  profileHref: string;
  userInitial: string;
};

export function AppTopBar({ profileHref, userInitial }: AppTopBarProps) {
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b border-violet-200/40 bg-card/90 py-3 shadow-[var(--game-shadow-sm)] backdrop-blur-md dark:border-violet-900/35 dark:bg-zinc-950/90"
      dir="rtl"
    >
      <div className="mx-auto flex h-11 max-w-lg items-center justify-between gap-3 px-4 sm:max-w-3xl">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          aria-label="اعلان‌ها"
          disabled
        >
          <Bell className="size-5" aria-hidden />
        </Button>

        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center font-heading text-lg font-black tracking-tight text-[#7E3AF2] dark:text-violet-400">
          حرفچی
        </h1>

        <Link
          href={profileHref}
          className={cn(
            "size-10 shrink-0 rounded-full p-0.5 ring-2 ring-violet-200/80 transition-colors hover:bg-violet-50/80",
            "dark:ring-violet-800 dark:hover:bg-violet-950/50",
          )}
          aria-label="پروفایل"
        >
          <span className="flex size-full items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-sm font-black text-white">
            {userInitial}
          </span>
        </Link>
      </div>
    </header>
  );
}
