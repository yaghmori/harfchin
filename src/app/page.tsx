import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";

export default function HomePage() {
  return (
    <SiteShell>
      <div className="flex flex-1 flex-col gap-10">
        <section className="space-y-4 text-center sm:text-right">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            اسم و فامیل آنلاین
          </h1>
          <p className="text-lg text-[var(--muted)] leading-relaxed">
            اتاق بسازید، کد را برای دوستان بفرستید و دورهای سریع با حروف فارسی
            بازی کنید. بدون نصب، فقط مرورگر.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/create"
            className="rounded-2xl border border-teal-200 bg-teal-600 px-6 py-5 text-center text-lg font-medium text-white shadow-md transition hover:bg-teal-700 dark:border-teal-800 dark:bg-teal-700 dark:hover:bg-teal-600"
          >
            ساخت اتاق
          </Link>
          <Link
            href="/join"
            className="rounded-2xl border border-slate-200 bg-[var(--card)] px-6 py-5 text-center text-lg font-medium shadow-sm transition hover:border-teal-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:border-teal-700 dark:hover:bg-slate-800/60"
          >
            ورود با کد اتاق
          </Link>
        </div>

        <ul className="space-y-2 text-sm text-[var(--muted)]">
          <li>• مهمان با کوکی مرورگر؛ آماده اتصال احراز هویت بعدی</li>
          <li>• به‌روزرسانی لحظه‌ای با polling سبک (۲–۳ ثانیه)</li>
          <li>• نرمال‌سازی فارسی برای مقایسه پاسخ‌ها</li>
        </ul>
      </div>
    </SiteShell>
  );
}
