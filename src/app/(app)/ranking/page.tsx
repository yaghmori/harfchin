import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "رده‌بندی | حرفچین",
};

export default function RankingPage() {
  return (
    <div className="flex flex-col items-center gap-6 pt-2 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/60">
        <Trophy className="size-10 text-amber-500" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-foreground">رده‌بندی هفته</h1>
        <p className="max-w-sm text-sm font-medium text-muted-foreground">
          جدول کامل رقابت هفتگی به‌زودی در همین صفحه نمایش داده می‌شود. فعلاً
          از خانه و اتاق‌های فعال بازی کنید و امتیاز جمع کنید.
        </p>
      </div>
      <Link
        href="/rooms"
        className={cn(buttonVariants({ size: "lg" }), "font-bold")}
      >
        رفتن به اتاق‌های فعال
      </Link>
    </div>
  );
}
