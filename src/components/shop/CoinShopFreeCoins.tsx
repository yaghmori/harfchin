"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Coins, Play } from "lucide-react";
import { toast } from "sonner";

function formatFaInt(n: number) {
  return n.toLocaleString("fa-IR", { useGrouping: false });
}

/** Shown on the reward pill (promo display). */
const PILL_AMOUNT = 500;
/** Actual gift described in the subtitle. */
const GIFT_COINS = 50;

export function CoinShopFreeCoins({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.25rem] border border-violet-200/70 bg-linear-to-l from-violet-100 from-40% via-violet-50/95 to-white py-4 ps-3 pe-4 shadow-[0_4px_24px_rgba(99,14,212,0.08)] dark:border-violet-800/45 dark:from-violet-950/90 dark:via-violet-950/50 dark:to-zinc-900",
        className,
      )}
    >
      <div className="flex flex-row items-center gap-3" dir="rtl">
        <Button
          type="button"
          size="icon-lg"
          className="size-[3.25rem] shrink-0 rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(99,14,212,0.42)] hover:brightness-110"
          aria-label="تماشای ویدیو"
          onClick={() =>
            toast.message("تماشای ویدیو به‌زودی فعال می‌شود.", {
              description: "در نسخه بعدی می‌توانید سکه رایگان بگیرید.",
            })
          }
        >
          <Play className="size-6 fill-current ms-0.5" aria-hidden />
        </Button>

        <div className="min-w-0 flex-1 space-y-1 text-start">
          <p className="text-[0.95rem] font-black leading-snug text-foreground">
            تماشای ویدیو تبلیغاتی
          </p>
          <p className="text-xs font-semibold leading-relaxed text-muted-foreground">
            {formatFaInt(GIFT_COINS)} سکه هدیه بگیرید
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/80 bg-white/95 px-3 py-2 shadow-sm dark:border-violet-800/50 dark:bg-violet-950/70">
          <span className="text-sm font-black tabular-nums text-violet-800 dark:text-violet-100">
            +{formatFaInt(PILL_AMOUNT)}
          </span>
          <Coins
            className="size-[1.15rem] shrink-0 text-amber-500 dark:text-amber-400"
            aria-hidden
            strokeWidth={2.25}
          />
        </div>
      </div>
    </div>
  );
}
