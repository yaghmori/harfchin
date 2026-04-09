"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ShopPackageRow } from "@/server/services/coin-shop.service";
import Image from "next/image";
import { Coins } from "lucide-react";
import { toast } from "sonner";

function formatFaCoins(n: number) {
  return n.toLocaleString("fa-IR");
}

function formatFaPrice(n: number) {
  return n.toLocaleString("fa-IR");
}

export function CoinShopPackageList({ packages }: { packages: ShopPackageRow[] }) {
  if (packages.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-muted-foreground/25 bg-card/80 p-6 text-center text-sm text-muted-foreground">
        بسته‌ای برای نمایش نیست. دیتابیس را با{" "}
        <code className="rounded bg-muted px-1 font-mono text-xs">pnpm db:push</code> و{" "}
        <code className="rounded bg-muted px-1 font-mono text-xs">pnpm db:seed</code> به‌روز
        کنید.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-5">
      {packages.map((pkg) => {
        const totalCoins = pkg.coinAmount + pkg.bonusAmount;
        const coinLine =
          pkg.bonusAmount > 0
            ? `مجموع سکه‌ها ${formatFaCoins(totalCoins)}`
            : `${formatFaCoins(pkg.coinAmount)} سکه`;
        const featuredCoinLine = `بیشترین مقدار سکه ${formatFaCoins(pkg.coinAmount)} سکه`;

        return (
          <li
            key={pkg.id}
            className={cn(
              "overflow-hidden rounded-[1.35rem] border shadow-[0_6px_28px_rgba(15,23,42,0.07)] transition-[box-shadow,transform] hover:shadow-[0_10px_36px_rgba(15,23,42,0.1)]",
              pkg.isFeatured
                ? "border-amber-400/45 ring-1 ring-amber-300/35 dark:border-amber-700/40 dark:ring-amber-900/30"
                : "border-slate-200/90 dark:border-zinc-700/80",
            )}
          >
            <div className="relative min-h-[11rem] w-full sm:min-h-[12rem]">
              <Image
                src={pkg.imageUrl}
                alt={pkg.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 28rem"
              />
              <div
                className={cn(
                  "absolute inset-0 bg-linear-to-b from-black/35 via-black/10 to-black/75",
                  pkg.isFeatured && "to-zinc-950/90",
                )}
              />

              {pkg.badgeText ? (
                <div className="absolute end-3 top-3 z-10 rounded-lg bg-linear-to-l from-amber-500 to-amber-400 px-2.5 py-1 text-[0.65rem] font-black text-amber-950 shadow-md">
                  {pkg.badgeText}
                </div>
              ) : null}

              <div className="absolute inset-x-0 bottom-0 z-[1] p-4 pt-14">
                <h3
                  className={cn(
                    "text-lg font-black leading-tight drop-shadow-sm sm:text-xl",
                    pkg.isFeatured
                      ? "text-amber-300"
                      : "text-white",
                  )}
                >
                  {pkg.title}
                </h3>
                <p
                  className={cn(
                    "mt-1.5 max-w-[95%] text-sm font-semibold leading-relaxed drop-shadow-sm",
                    pkg.isFeatured ? "text-amber-100/90" : "text-white/90",
                  )}
                >
                  {pkg.description}
                </p>
              </div>
            </div>

            <div
              className={cn(
                "flex items-center justify-between gap-3 border-t px-4 py-4",
                pkg.isFeatured
                  ? "border-zinc-700/90 bg-zinc-800 text-white dark:bg-zinc-900"
                  : "border-slate-100 bg-white dark:border-zinc-700 dark:bg-zinc-950",
              )}
              dir="rtl"
            >
              <div className="flex min-w-0 items-center gap-2">
                {pkg.bonusAmount > 0 && !pkg.isFeatured ? (
                  <Coins
                    className="size-5 shrink-0 text-amber-500 dark:text-amber-400"
                    strokeWidth={2}
                    aria-hidden
                  />
                ) : null}
                <span
                  className={cn(
                    "text-sm font-black leading-snug sm:text-[0.95rem]",
                    pkg.isFeatured
                      ? "text-amber-100"
                      : "text-foreground dark:text-zinc-100",
                  )}
                >
                  {pkg.isFeatured ? featuredCoinLine : coinLine}
                </span>
              </div>

              <Button
                type="button"
                className={cn(
                  "h-11 shrink-0 rounded-xl px-5 text-sm font-black shadow-md sm:h-12 sm:px-6 sm:text-[0.95rem]",
                  pkg.isFeatured
                    ? "rounded-full border-0 bg-linear-to-b from-amber-400 to-amber-500 text-amber-950 shadow-[0_6px_20px_rgba(245,158,11,0.35)] hover:brightness-105"
                    : "bg-primary text-primary-foreground hover:brightness-110",
                )}
                onClick={() =>
                  toast.message("خرید به‌زودی", {
                    description: `بسته «${pkg.title}» بعد از اتصال درگاه پرداخت فعال می‌شود.`,
                  })
                }
              >
                {formatFaPrice(pkg.priceTomans)} {pkg.currencyLabel}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
