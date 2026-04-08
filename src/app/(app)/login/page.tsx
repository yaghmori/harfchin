import type { Metadata } from "next";
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
  if (user && !user.isGuest && user.email && user.passwordHash) {
    redirect("/profile");
  }

  return (
    <div className="ka-auth-page flex flex-1 flex-col items-center justify-center bg-ka-surface py-6 text-ka-on-surface selection:bg-ka-primary-fixed selection:text-ka-on-primary-fixed">
      <main className="flex w-full max-w-md flex-col items-center px-8 py-4">
        <div className="mb-12 flex flex-col items-center">
          <div className="relative mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-ka-surface-container-lowest shadow-[0_12px_32px_rgba(25,28,29,0.06)]">
            <div
              className="absolute inset-0 rounded-full bg-ka-secondary/30 blur-2xl opacity-20"
              aria-hidden
            />
            <span className="relative text-5xl font-black text-ka-primary">
              آ
            </span>
          </div>
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-ka-on-surface">
            خوش آمدید
          </h1>
          <p className="text-center font-medium text-ka-on-surface-variant">
            برای ورود به دنیای بازی حرفچی مشخصات خود را وارد کنید
          </p>
        </div>

        <Suspense
          fallback={
            <div
              className="h-48 w-full animate-pulse rounded-2xl bg-ka-surface-container-high/60"
              aria-busy
              aria-label="بارگذاری فرم ورود"
            />
          }
        >
          <AuthLoginClient />
        </Suspense>
      </main>

      <footer className="px-8 pb-6 text-center">
        <p className="text-sm font-medium text-ka-on-surface-variant">
          حساب کاربری ندارید؟{" "}
          <Link
            href="/signup"
            className="font-bold text-ka-primary hover:underline"
          >
            ثبت‌نام کنید
          </Link>
        </p>
      </footer>
    </div>
  );
}
