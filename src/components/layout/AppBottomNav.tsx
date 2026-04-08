"use client";

import { cn } from "@/lib/utils";
import { Home, LayoutGrid, Trophy, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "خانه", icon: Home, match: "exact" as const },
  {
    href: "/rooms",
    label: "اتاق بازی",
    icon: LayoutGrid,
    match: "rooms" as const,
  },
  {
    href: "/ranking",
    label: "رتبه‌بندی",
    icon: Trophy,
    match: "prefix" as const,
  },
  {
    href: "/profile",
    label: "پروفایل",
    icon: UserRound,
    match: "prefix" as const,
  },
] as const;

function isNavActive(
  pathname: string,
  href: string,
  match: (typeof NAV_ITEMS)[number]["match"],
): boolean {
  if (match === "exact") return pathname === href;
  if (match === "prefix")
    return pathname === href || pathname.startsWith(`${href}/`);
  return (
    pathname.startsWith("/rooms") ||
    pathname.startsWith("/create") ||
    pathname.startsWith("/join") ||
    pathname.startsWith("/lobby")
  );
}

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-violet-200/50 bg-card/95 px-2 pt-1.5 shadow-[0_-8px_24px_rgba(126,58,242,0.08)] backdrop-blur-md dark:border-violet-900/40 dark:bg-zinc-950/95"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
      aria-label="ناوبری اصلی"
      dir="rtl"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around sm:max-w-3xl">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = isNavActive(pathname, href, match);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-[4.25rem] flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 transition-colors",
                active
                  ? "text-[#7E3AF2] dark:text-violet-300"
                  : "text-zinc-400 hover:text-violet-600 dark:text-zinc-500 dark:hover:text-violet-300",
              )}
            >
              <span
                className={cn(
                  "grid size-10 place-items-center rounded-xl transition-colors",
                  active
                    ? "bg-violet-100 dark:bg-violet-900/40"
                    : "bg-transparent",
                )}
              >
                <Icon className="size-[22px]" aria-hidden strokeWidth={2} />
              </span>
              <span className="text-[10px] font-bold leading-tight">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
