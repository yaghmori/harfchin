import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthSignUpClient } from "@/components/auth/AuthSignUpClient";
import { getSessionUser } from "@/server/session";

export const metadata: Metadata = {
  title: "ثبت‌نام",
};

export default async function SignUpPage() {
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

      <footer className="px-8 pb-6 text-center">
        <p className="text-sm font-medium text-ka-on-surface-variant">
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
