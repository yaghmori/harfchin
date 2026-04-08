import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthBottomNav } from "@/components/auth/AuthBottomNav";
import { AuthSignUpClient } from "@/components/auth/AuthSignUpClient";
import { AuthTopBar } from "@/components/auth/AuthTopBar";
import { getSessionUser } from "@/server/session";

export const metadata: Metadata = {
  title: "ثبت‌نام | Kinetic Air",
};

export default async function SignUpPage() {
  const user = await getSessionUser();
  if (user && !user.isGuest && user.email && user.passwordHash) {
    redirect("/profile");
  }

  return (
    <div className="ka-auth-page flex min-h-[max(884px,100dvh)] min-h-screen flex-col items-center justify-center bg-ka-surface text-ka-on-surface selection:bg-ka-primary-fixed selection:text-ka-on-primary-fixed">
      <AuthTopBar />

      <main className="flex w-full max-w-md flex-col items-center px-8 pt-24 pb-32">
        <div className="mb-12 flex flex-col items-center">
          <div className="relative mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-ka-surface-container-lowest shadow-[0_12px_32px_rgba(25,28,29,0.06)]">
            <div
              className="absolute inset-0 rounded-full bg-ka-secondary/30 blur-2xl opacity-20"
              aria-hidden
            />
            <span className="relative text-5xl font-black text-ka-primary">
              ف
            </span>
          </div>
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-ka-on-surface">
            حساب بسازید
          </h1>
          <p className="text-center font-medium text-ka-on-surface-variant">
            چند فیلد ساده — وارد دنیای کلمات و بازی گروهی شوید
          </p>
        </div>

        <AuthSignUpClient />
      </main>

      <AuthBottomNav active="signup" />

      <footer className="hidden py-8 md:block">
        <p className="font-medium text-ka-on-surface-variant">
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <Link
            href="/login"
            className="font-bold text-ka-primary hover:underline"
          >
            ورود به حساب
          </Link>
        </p>
      </footer>
    </div>
  );
}
