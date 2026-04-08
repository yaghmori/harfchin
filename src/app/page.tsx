import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <SiteShell>
      <div className="game-menu-clouds flex flex-1 flex-col gap-8">
        <section className="space-y-3 text-center sm:text-right">
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            اسم و فامیل آنلاین
          </h1>
          <p className="text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
            اتاق بسازید، کد را برای دوستان بفرستید و دورهای سریع با حروف فارسی
            بازی کنید. بدون نصب، فقط مرورگر.
          </p>
        </section>

        <div className="grid max-w-md gap-4 self-center sm:self-stretch">
          <Button
            render={<Link href="/create" />}
            nativeButton={false}
            variant="gameWarm"
            className="w-full justify-center gap-3 ps-4"
          >
            <span className="text-2xl" aria-hidden>
              🗺️
            </span>
            ساخت اتاق
          </Button>
          <Button
            render={<Link href="/join" />}
            nativeButton={false}
            variant="gameMint"
            className="w-full justify-center gap-3 ps-4"
          >
            <span className="text-2xl" aria-hidden>
              🧩
            </span>
            ورود با کد اتاق
          </Button>
        </div>

        <ul className="mx-auto max-w-md space-y-2.5 rounded-2xl border border-border/40 bg-card/80 px-4 py-4 text-sm font-medium text-muted-foreground shadow-[var(--game-shadow-sm)] backdrop-blur-sm">
          <li className="flex gap-2">
            <span className="text-[var(--game-blue)]" aria-hidden>
              ●
            </span>
            مهمان با کوکی مرورگر؛ آماده اتصال احراز هویت بعدی
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--game-green)]" aria-hidden>
              ●
            </span>
            به‌روزرسانی لحظه‌ای با اتصال به سرور
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--game-gold-deep)]" aria-hidden>
              ●
            </span>
            نرمال‌سازی فارسی برای مقایسه پاسخ‌ها
          </li>
        </ul>
      </div>
    </SiteShell>
  );
}
