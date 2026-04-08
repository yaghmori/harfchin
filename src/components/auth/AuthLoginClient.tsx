"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { apiPost } from "@/features/api/client";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

export function AuthLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(data: { identifier: string; password: string }) {
    setError(null);
    setPending(true);
    try {
      await apiPost("/api/auth/login", {
        email: data.identifier.trim(),
        password: data.password,
      });
      const target =
        from && from.startsWith("/") && !from.startsWith("//")
          ? from
          : "/";
      router.push(target);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ورود ناموفق بود.");
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
      <LoginForm
        onSubmit={onSubmit}
        className={pending ? "pointer-events-none opacity-70" : undefined}
      />
    </div>
  );
}
