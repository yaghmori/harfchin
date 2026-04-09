import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthLoginClient } from "@/components/auth/AuthLoginClient";
import { getSessionUser } from "@/server/session";

export const metadata: Metadata = {
  title: "ورود",
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user && !user.isGuest && user.passwordHash) {
    redirect("/profile");
  }

  return (
    <div className="auth-page flex flex-1 flex-col items-center justify-center bg-background py-6 text-foreground selection:bg-primary/20 selection:text-primary">
      <main className="flex w-full max-w-md flex-col items-center px-8 py-4">
        <div className="mb-12 flex flex-col items-center">
          <h1 className="sr-only">ورود</h1>
          <div className="relative mb-6 flex w-full max-w-[280px] items-center justify-center">
            <div
              className="absolute inset-x-4 -inset-y-6 rounded-3xl bg-secondary/40 blur-2xl opacity-30"
              aria-hidden
            />
            <Image
              src="/logo-type.png"
              alt="حرفچین"
              width={560}
              height={160}
              className="relative h-14 w-auto max-w-full object-contain drop-shadow-[0_8px_24px_rgba(25,28,29,0.08)]"
              priority
            />
          </div>
          <p className="mb-2 text-3xl font-extrabold tracking-tight text-foreground">
            خوش آمدید
          </p>
          <p className="text-center font-medium text-muted-foreground">
            برای ورود به دنیای بازی حرفچی مشخصات خود را وارد کنید
          </p>
        </div>

        <Suspense
          fallback={
            <div
              className="h-48 w-full animate-pulse rounded-2xl bg-muted/70"
              aria-busy
              aria-label="بارگذاری فرم ورود"
            />
          }
        >
          <AuthLoginClient />
        </Suspense>
      </main>

      <footer className="px-8 pb-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          حساب کاربری ندارید؟{" "}
          <Link
            href="/signup"
            className="font-bold text-primary hover:underline"
          >
            ثبت‌نام کنید
          </Link>
        </p>
      </footer>
    </div>
  );
}
