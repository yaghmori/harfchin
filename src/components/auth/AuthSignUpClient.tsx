"use client";

import { SignUpForm } from "@/components/auth/SignUpForm";
import { apiPost } from "@/features/api/client";
import { useRouter } from "next/navigation";
import * as React from "react";

export function AuthSignUpClient() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    setError(null);
    setPending(true);
    try {
      await apiPost("/api/auth/signup", {
        email: data.email.trim(),
        password: data.password,
        confirmPassword: data.confirmPassword,
        name: data.name.trim(),
      });
      router.push("/profile");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ثبت‌نام ناموفق بود.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full space-y-4">
      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <SignUpForm
        onSubmit={onSubmit}
        className={pending ? "pointer-events-none opacity-70" : undefined}
      />
    </div>
  );
}
