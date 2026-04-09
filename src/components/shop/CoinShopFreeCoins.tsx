"use client";

import { CoinImage } from "@/components/media/CoinImage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
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
        "relative overflow-hidden rounded-[1.25rem] border border-primary/25 bg-primary py-4 ps-3 pe-4 shadow-[0_10px_36px_rgba(99,14,212,0.35)] dark:border-primary/40 dark:shadow-[0_10px_40px_rgba(99,14,212,0.25)]",
        "before:pointer-events-none before:absolute before:-end-1/4 before:-top-1/2 before:size-[120%] before:rounded-full before:bg-white/10",
        className,
      )}
    >
      <div className="relative flex flex-row items-center gap-3" dir="rtl">
        <Button
          type="button"
          size="icon-lg"
          className="size-[3.25rem] shrink-0 rounded-full border-0 bg-white text-primary shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:bg-white/95 hover:brightness-105"
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
          <p className="text-[0.95rem] font-black leading-snug text-primary-foreground">
            تماشای ویدیو تبلیغاتی
          </p>
          <p className="text-xs font-semibold leading-relaxed text-primary-foreground/88">
            {formatFaInt(GIFT_COINS)} سکه هدیه بگیرید
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/35 bg-white/98 px-3 py-2 shadow-md dark:bg-white/95">
          <span className="text-sm font-black tabular-nums text-primary">
            +{formatFaInt(PILL_AMOUNT)}
          </span>
          <CoinImage size={22} className="size-[1.35rem]" />
        </div>
      </div>
    </div>
  );
}
