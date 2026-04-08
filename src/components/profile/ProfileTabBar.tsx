"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Gamepad2, Home, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "خانه", icon: Home, match: "exact" as const },
  { href: "/create", label: "بازی", icon: Gamepad2, match: "prefix" as const },
  { href: "/rooms", label: "رتبه‌بندی", icon: BarChart3, match: "prefix" as const },
  { href: "/profile", label: "پروفایل", icon: UserRound, match: "prefix" as const },
] as const;

export function ProfileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 z-50 w-full border-t border-violet-100/80 bg-white/95 px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-6px_24px_rgba(126,58,242,0.06)] backdrop-blur-md dark:border-violet-900/50 dark:bg-zinc-950/95"
      aria-label="ناوبری اصلی"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active =
            match === "exact"
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-[4.5rem] flex-col items-center gap-1 rounded-2xl px-3 py-1.5 transition-colors",
                active
                  ? "text-[#7E3AF2]"
                  : "text-zinc-400 hover:text-violet-600 dark:text-zinc-500 dark:hover:text-violet-300",
              )}
            >
              <span
                className={cn(
                  "grid size-11 place-items-center rounded-full transition-colors",
                  active
                    ? "bg-[#7E3AF2] text-white shadow-[0_6px_16px_rgba(126,58,242,0.35)]"
                    : "bg-transparent",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="text-[11px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
