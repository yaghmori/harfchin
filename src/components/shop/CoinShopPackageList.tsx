"use client";

import { CoinImage } from "@/components/media/CoinImage";
import { Button } from "@/components/ui/button";
import { resolveShopImageUrl } from "@/lib/shop-image";
import { cn } from "@/lib/utils";
import type { ShopPackageRow } from "@/server/services/coin-shop.service";
import Image from "next/image";
import { toast } from "sonner";

function formatFaCoins(n: number) {
  return n.toLocaleString("fa-IR");
}

function formatFaPrice(n: number) {
  return n.toLocaleString("fa-IR");
}

const easeOut = "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]";

type PackageCardProps = {
  pkg: ShopPackageRow;
  index: number;
};

function ShopPackageCard({ pkg, index }: PackageCardProps) {
  const { src, isRemote } = resolveShopImageUrl(pkg.imageUrl);
  const totalCoins = pkg.coinAmount + pkg.bonusAmount;
  const coinLine =
    pkg.bonusAmount > 0
      ? `مجموع سکه‌ها ${formatFaCoins(totalCoins)}`
      : `${formatFaCoins(pkg.coinAmount)} سکه`;
  const featuredCoinLine = `بیشترین مقدار سکه ${formatFaCoins(pkg.coinAmount)} سکه`;

  const onPurchase = () =>
    toast.message("خرید به‌زودی", {
      description: `بسته «${pkg.title}» بعد از اتصال درگاه پرداخت فعال می‌شود.`,
    });

  const featured = pkg.isFeatured;

  return (
    <li
      className={cn(
        "group/card list-none rounded-[1.4rem] border shadow-[0_10px_40px_rgba(15,23,42,0.09)] will-change-transform",
        `transition-[box-shadow,transform,border-color] duration-500 ${easeOut}`,
        "hover:-translate-y-1 hover:shadow-[0_22px_56px_rgba(15,23,42,0.16)]",
        "focus-within:-translate-y-1 focus-within:shadow-[0_22px_56px_rgba(15,23,42,0.16)] focus-within:ring-2 focus-within:ring-primary/45 focus-within:ring-offset-2 focus-within:ring-offset-background",
        "motion-reduce:transform-none motion-reduce:transition-shadow motion-reduce:hover:translate-y-0",
        featured
          ? "border-amber-400/55 ring-2 ring-amber-300/50 shadow-[0_12px_48px_rgba(245,158,11,0.12)] hover:border-amber-400/80 hover:shadow-[0_28px_72px_rgba(245,158,11,0.22)] hover:ring-amber-400/65 dark:border-amber-600/50 dark:ring-amber-600/35 dark:hover:border-amber-500/70"
          : "border-slate-200/90 dark:border-zinc-700/80",
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-[1.4rem] isolate",
          featured
            ? "aspect-[16/11] min-h-[15rem] sm:aspect-[16/10] sm:min-h-[17rem]"
            : "aspect-[16/10] min-h-[12.5rem] sm:aspect-[16/9] sm:min-h-[14rem]",
        )}
      >
        <Image
          src={src}
          alt={pkg.title}
          fill
          unoptimized={isRemote}
          priority={index === 0}
          sizes="(max-width: 640px) 100vw, 36rem"
          className={cn(
            "object-cover transition-all duration-700 ease-out",
            featured
              ? "group-hover/card:scale-[1.09] group-hover/card:brightness-[1.06]"
              : "group-hover/card:scale-[1.06] group-hover/card:brightness-[1.04]",
            "motion-reduce:group-hover/card:scale-100 motion-reduce:group-hover/card:brightness-100",
          )}
        />

        <div
          className={cn(
            "absolute inset-0 transition-[background,opacity] duration-500 ease-out",
            featured
              ? "bg-linear-to-t from-zinc-950/96 via-zinc-900/58 to-zinc-800/35 group-hover/card:from-zinc-950/98 group-hover/card:via-zinc-900/65"
              : "bg-linear-to-t from-black/90 via-black/48 to-black/28 group-hover/card:from-black/93 group-hover/card:via-black/52 group-hover/card:to-black/20",
          )}
          aria-hidden
        />

        <div
          className={cn(
            "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100",
            "bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(251,191,36,0.15),transparent_65%)]",
            !featured &&
              "bg-[radial-gradient(ellipse_80%_55%_at_50%_100%,rgba(168,85,247,0.12),transparent_60%)]",
            "motion-reduce:group-hover/card:opacity-0",
          )}
          aria-hidden
        />

        <div
          className={cn(
            "absolute inset-0 flex flex-col justify-between p-4 sm:p-6",
            `transition-transform duration-500 ${easeOut}`,
            "group-hover/card:-translate-y-1 motion-reduce:group-hover/card:translate-y-0",
          )}
          dir="rtl"
        >
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <h3
              className={cn(
                "min-w-0 flex-1 text-start font-black leading-[1.15] tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] transition-[transform,color,filter] duration-500 ease-out",
                "group-hover/card:drop-shadow-[0_4px_20px_rgba(0,0,0,0.55)]",
                featured
                  ? "text-2xl text-amber-300 sm:text-3xl sm:leading-[1.12] group-hover/card:scale-[1.02] group-hover/card:text-amber-200"
                  : "text-xl text-white sm:text-2xl group-hover/card:scale-[1.015]",
                "motion-reduce:group-hover/card:scale-100",
              )}
            >
              {pkg.title}
            </h3>
            {pkg.badgeText ? (
              <span
                className={cn(
                  "shrink-0 rounded-xl bg-linear-to-l from-amber-500 to-amber-400 px-3 py-1.5 text-xs font-black text-amber-950 shadow-lg transition-[transform,box-shadow] duration-300",
                  "group-hover/card:-translate-y-0.5 group-hover/card:shadow-xl sm:text-sm sm:px-3.5 sm:py-2",
                  "motion-reduce:group-hover/card:translate-y-0",
                )}
              >
                {pkg.badgeText}
              </span>
            ) : null}
          </div>

          <div className="space-y-4 pt-4 sm:space-y-5 sm:pt-8">
            <p
              className={cn(
                "line-clamp-2 text-start font-semibold leading-relaxed drop-shadow-md transition-[transform,opacity] duration-500 sm:line-clamp-3",
                "group-hover/card:translate-y-[-2px] motion-reduce:group-hover/card:translate-y-0",
                featured
                  ? "text-base text-amber-100/95 sm:text-lg sm:leading-relaxed group-hover/card:text-amber-50"
                  : "text-base text-white/93 sm:text-lg group-hover/card:text-white",
              )}
            >
              {pkg.description}
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
              <div className="flex min-w-0 items-center gap-2.5 text-start sm:gap-3">
                {pkg.bonusAmount > 0 && !featured ? (
                  <CoinImage
                    size={28}
                    className="size-7 transition-transform duration-300 group-hover/card:scale-110 sm:size-8"
                  />
                ) : null}
                {featured ? (
                  <CoinImage
                    size={28}
                    className="size-7 drop-shadow-[0_2px_8px_rgba(251,191,36,0.45)] sm:size-8"
                  />
                ) : null}
                <span
                  className={cn(
                    "font-black leading-snug transition-[transform,color] duration-300",
                    featured
                      ? "text-lg text-amber-200 sm:text-xl group-hover/card:text-amber-100"
                      : "text-base text-white sm:text-lg group-hover/card:scale-[1.02]",
                    "motion-reduce:group-hover/card:scale-100",
                  )}
                >
                  {featured ? featuredCoinLine : coinLine}
                </span>
              </div>

              <Button
                type="button"
                className={cn(
                  "relative h-14 w-full shrink-0 overflow-hidden rounded-xl px-7 font-black shadow-xl transition-[transform,box-shadow,filter] duration-300 sm:min-h-[3.75rem] sm:w-auto sm:min-w-[11rem] sm:px-8",
                  "hover:scale-[1.03] hover:shadow-2xl active:scale-[0.97]",
                  "before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:bg-linear-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700 before:ease-out",
                  "hover:before:translate-x-full motion-reduce:before:hidden motion-reduce:hover:scale-100",
                  featured
                    ? "rounded-full border-0 bg-linear-to-b from-amber-400 to-amber-500 text-base text-amber-950 shadow-[0_8px_28px_rgba(245,158,11,0.45)] hover:brightness-110 hover:shadow-[0_14px_40px_rgba(245,158,11,0.55)] sm:text-lg"
                    : "bg-primary text-base text-primary-foreground hover:brightness-110 sm:text-lg",
                )}
                onClick={onPurchase}
              >
                {formatFaPrice(pkg.priceTomans)} {pkg.currencyLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

export function CoinShopPackageList({
  packages,
}: {
  packages: ShopPackageRow[];
}) {
  if (packages.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-muted-foreground/25 bg-card/80 p-6 text-center text-sm text-muted-foreground">
        بسته‌ای برای نمایش نیست. دیتابیس را با{" "}
        <code className="rounded bg-muted px-1 font-mono text-xs">
          pnpm db:push
        </code>{" "}
        و{" "}
        <code className="rounded bg-muted px-1 font-mono text-xs">
          pnpm db:seed
        </code>{" "}
        به‌روز کنید.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-7 sm:gap-8">
      {packages.map((pkg, index) => (
        <ShopPackageCard key={pkg.id} pkg={pkg} index={index} />
      ))}
    </ul>
  );
}
