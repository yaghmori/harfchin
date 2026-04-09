"use client";

import { cn } from "@/lib/utils";
import { Home, LayoutGrid, LogIn, Trophy, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

type MatchKind = "exact" | "prefix" | "rooms" | "account";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: MatchKind;
  accountPrefixes?: readonly string[];
};

const BASE_ITEMS: NavItem[] = [
  { href: "/", label: "خانه", icon: Home, match: "exact" },
  {
    href: "/rooms",
    label: "اتاق بازی",
    icon: LayoutGrid,
    match: "rooms",
  },
  {
    href: "/ranking",
    label: "رتبه‌بندی",
    icon: Trophy,
    match: "prefix",
  },
  {
    href: "/friends",
    label: "دوستان",
    icon: Users,
    match: "prefix",
  },
];

function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.match === "exact") return pathname === item.href;
  if (item.match === "prefix")
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  if (item.match === "rooms") {
    return (
      pathname.startsWith("/rooms") ||
      pathname.startsWith("/create") ||
      pathname.startsWith("/join") ||
      pathname.startsWith("/lobby")
    );
  }
  if (item.match === "account" && item.accountPrefixes) {
    return item.accountPrefixes.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
  }
  return false;
}

export type BottomNavAccountTab = {
  href: string;
  label: string;
  variant: "profile" | "login";
  prefixes: readonly string[];
};

export type AppBottomNavProps = {
  /** Omitted when user is not logged in (registered) — fourth tab hidden */
  account?: BottomNavAccountTab;
};

export function AppBottomNav({ account }: AppBottomNavProps) {
  const pathname = usePathname();

  const items: NavItem[] = account
    ? [
        ...BASE_ITEMS,
        {
          href: account.href,
          label: account.label,
          icon: account.variant === "login" ? LogIn : UserRound,
          match: "account" as const,
          accountPrefixes: account.prefixes,
        },
      ]
    : [...BASE_ITEMS];

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
        {items.map((item) => {
          const active = isNavActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "flex min-w-17 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 transition-colors",
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
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
