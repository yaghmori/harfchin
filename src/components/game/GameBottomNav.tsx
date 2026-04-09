"use client";

import Link from "next/link";
import { BarChart3, Gamepad2, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type GameBottomNavProps = {
  active: "game" | "rooms" | "leaderboard" | "settings";
};

const itemClass = (active: boolean) =>
  cn(
    "flex flex-col items-center justify-center rounded-full px-5 py-2 transition-colors duration-300 ease-out",
    active
      ? "scale-105 bg-violet-100 text-primary dark:bg-violet-900/30 dark:text-violet-200"
      : "text-zinc-400 hover:text-primary dark:text-zinc-500 dark:hover:text-violet-300",
  );

export function GameBottomNav({ active }: GameBottomNavProps) {
  return (
    <nav
      className="flex w-full items-center justify-around rounded-t-[3rem] bg-white/90 px-4 pt-12 pb-6 shadow-[0_-8px_24px_rgba(25,28,29,0.04)] backdrop-blur-lg dark:bg-zinc-950/90"
      aria-label="ناوبری اصلی"
    >
      <Link href="/" className={itemClass(active === "game")}>
        <Gamepad2
          className={cn("size-6", active === "game" && "fill-current")}
          strokeWidth={active === "game" ? 2.25 : 2}
          aria-hidden
        />
        <span className="mt-0.5 font-heading text-[10px] font-bold">بازی</span>
      </Link>
      <Link href="/rooms" className={itemClass(active === "rooms")}>
        <Users className="size-6" aria-hidden />
        <span className="mt-0.5 font-heading text-[10px] font-bold">روم‌ها</span>
      </Link>
      <Link href="/" className={itemClass(active === "leaderboard")}>
        <BarChart3 className="size-6" aria-hidden />
        <span className="mt-0.5 font-heading text-[10px] font-bold">
          رتبه‌بندی
        </span>
      </Link>
      <button
        type="button"
        disabled
        className={cn(
          itemClass(false),
          "cursor-not-allowed opacity-50",
        )}
        title="به زودی"
      >
        <Settings className="size-6" aria-hidden />
        <span className="mt-0.5 font-heading text-[10px] font-bold">
          تنظیمات
        </span>
      </button>
    </nav>
  );
}
