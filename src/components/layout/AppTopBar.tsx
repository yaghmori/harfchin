"use client";

import { AppUserMenu } from "@/components/layout/AppUserMenu";
import type { ShellAuthMode } from "@/components/layout/shell-auth";
import { CoinImage } from "@/components/media/CoinImage";
import { Button, buttonVariants } from "@/components/ui/button";
import { DEFAULT_USER_AVATAR_SRC } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export type AppTopBarProps = {
  authMode: ShellAuthMode;
  /** Set from the server for registered users only. */
  coins?: number;
};

function AppLogo({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Image
        src="/logo-type.png"
        alt="لوگوی حرف چی"
        width={190}
        height={72}
        priority
        className={cn(
          "w-auto object-contain",
          compact ? "h-8 sm:h-9" : "h-10 sm:h-11",
        )}
      />
    </div>
  );
}

function formatFaInt(n: number) {
  return n.toLocaleString("fa-IR", { useGrouping: false });
}

const titleClass =
  "truncate px-20 text-2xl font-extrabold text-primary sm:px-24 sm:text-xl dark:text-violet-300";

export function AppTopBar({ authMode, coins }: AppTopBarProps) {
  const isRegistered = authMode === "registered";
  const pathname = usePathname();
  const router = useRouter();
  const { title, showBack } = getPageHeader(pathname);
  const showCoins =
    isRegistered && typeof coins === "number" && Number.isFinite(coins);
  const coinsLabel = showCoins ? `${formatFaInt(coins)} سکه` : "";
  const loginHref = `/login?from=${encodeURIComponent(pathname && pathname !== "/login" ? pathname : "/")}`;
  /** Same chrome as home: no centered title; logo-type on the right. */
  const logoTopBar =
    !pathname ||
    pathname === "/" ||
    pathname === "/rooms" ||
    pathname === "/ranking" ||
    pathname === "/friends" ||
    pathname === "/profile";

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 min-h-16 border-b border-violet-200/40 bg-card/90 py-3 shadow-sm backdrop-blur-md dark:border-violet-900/35 dark:bg-zinc-950/90"
      dir="rtl"
    >
      <div className="relative mx-auto flex min-h-13 max-w-lg items-center px-4 sm:max-w-3xl">
        {showBack ? (
          <>
            <div className="absolute left-4 z-10 sm:left-6">
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-11 shrink-0 text-primary hover:bg-primary/10 hover:text-primary dark:text-violet-300 dark:hover:bg-violet-950/50 dark:hover:text-violet-200"
                aria-label="بازگشت"
                onClick={() => router.back()}
              >
                <ArrowLeft className="size-8" strokeWidth={2.5} aria-hidden />
              </Button>
            </div>
            <div className="pointer-events-none  absolute inset-x-0 flex items-center justify-center">
              <span className={titleClass}>{title}</span>
            </div>
          </>
        ) : logoTopBar ? (
          <>
            <div className="absolute left-4 z-10 sm:left-6">
              {showCoins ? (
                <Link
                  href="/shop"
                  className="inline-flex items-center  gap-2 rounded-full border border-yellow-400 bg-yellow-300 px-3 py-1.5  font-black text-yellow-900 shadow-sm   transition-all hover:bg-yellow-400  active:scale-[0.99] duration-500"
                >
                  <CoinImage size={26} className="size-[1.625rem] " />
                  <span>{coinsLabel}</span>
                </Link>
              ) : (
                <Link
                  href={loginHref}
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "h-10 rounded-full px-4 text-sm font-bold shadow-sm",
                  )}
                >
                  ورود / ثبت‌نام
                </Link>
              )}
            </div>

            <div className="absolute right-4 z-10 flex items-center gap-2 sm:right-6">
              {isRegistered ? (
                <>
                  <AppUserMenu
                    mode={authMode}
                    accountAvatarSrc={DEFAULT_USER_AVATAR_SRC}
                  />
                  <AppLogo compact />
                </>
              ) : (
                <AppLogo />
              )}
            </div>
          </>
        ) : (
          <>
            <div className="absolute left-4 z-10 sm:left-6">
              {showCoins ? (
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-yellow-500 px-3 py-1.5 text-sm font-black text-primary shadow-sm ring-1 ring-primary/15 transition-[transform,box-shadow,background-color] hover:bg-primary/18 hover:ring-primary/25 active:scale-[0.99] dark:bg-primary/20 dark:text-violet-100 dark:ring-primary/30 dark:hover:bg-primary/28"
                >
                  <CoinImage size={26} className="size-[1.625rem]" />
                  <span>{coinsLabel}</span>
                </Link>
              ) : (
                <Link
                  href={loginHref}
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "h-10 rounded-full px-4 text-sm font-bold shadow-sm",
                  )}
                >
                  ورود / ثبت‌نام
                </Link>
              )}
            </div>

            <div className="pointer-events-none absolute  inset-x-0 flex items-center justify-center">
              <span className={titleClass}>{title}</span>
            </div>

            {isRegistered ? (
              <div className="absolute right-4 z-10 sm:right-6">
                <AppUserMenu
                  mode={authMode}
                  accountAvatarSrc={DEFAULT_USER_AVATAR_SRC}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </header>
  );
}

function getPageHeader(pathname: string | null): {
  title: string;
  showBack: boolean;
} {
  if (!pathname || pathname === "/") return { title: "", showBack: false };
  if (pathname === "/rooms") return { title: "", showBack: false };
  if (pathname === "/ranking") return { title: "", showBack: false };
  if (pathname === "/profile") return { title: "", showBack: false };
  if (pathname === "/friends") return { title: "", showBack: false };
  if (pathname === "/create") return { title: "ایجاد اتاق", showBack: true };
  if (pathname === "/join") return { title: "ورود به اتاق", showBack: true };
  if (pathname === "/profile/edit")
    return { title: "ویرایش پروفایل", showBack: true };
  if (pathname === "/login") return { title: "ورود", showBack: true };
  if (pathname === "/signup") return { title: "ثبت‌نام", showBack: true };
  if (pathname.startsWith("/lobby/")) return { title: "لابی", showBack: true };
  if (pathname.startsWith("/game/")) return { title: "بازی", showBack: true };
  if (pathname.startsWith("/results/"))
    return { title: "نتیجه", showBack: true };
  if (pathname === "/shop") return { title: "فروشگاه سکه", showBack: true };
  return { title: "حرف چی", showBack: false };
}
