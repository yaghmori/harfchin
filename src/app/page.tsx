import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <SiteShell>
      <div className="flex flex-1 flex-col gap-10">
        <section className="space-y-4 text-center sm:text-right">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            اسم و فامیل آنلاین
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            اتاق بسازید، کد را برای دوستان بفرستید و دورهای سریع با حروف فارسی
            بازی کنید. بدون نصب، فقط مرورگر.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <Button
            render={<Link href="/create" />}
            nativeButton={false}
            size="lg"
            className="h-auto min-h-11 w-full border-teal-200 bg-teal-600 py-5 text-base text-white shadow-md hover:bg-teal-700 dark:border-teal-800 dark:bg-teal-700 dark:hover:bg-teal-600"
          >
            ساخت اتاق
          </Button>
          <Button
            variant="outline"
            render={<Link href="/join" />}
            nativeButton={false}
            size="lg"
            className="h-auto min-h-11 w-full py-5 text-base shadow-sm hover:border-teal-300 hover:bg-accent dark:hover:border-teal-700"
          >
            ورود با کد اتاق
          </Button>
        </div>

        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• مهمان با کوکی مرورگر؛ آماده اتصال احراز هویت بعدی</li>
          <li>• به‌روزرسانی لحظه‌ای با polling سبک (۲–۳ ثانیه)</li>
          <li>• نرمال‌سازی فارسی برای مقایسه پاسخ‌ها</li>
        </ul>
      </div>
    </SiteShell>
  );
}
