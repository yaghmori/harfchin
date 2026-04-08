"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { apiPost } from "@/features/api/client";
import { fieldErrorsFromZodIssues } from "@/lib/zod-field-errors";
import { loginBodySchema } from "@/lib/validation/auth";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

export function AuthLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const [fieldErrors, setFieldErrors] = React.useState<
    Partial<Record<"identifier" | "password", string>>
  >({});
  const [pending, setPending] = React.useState(false);

  function clearField(field: "identifier" | "password") {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function onSubmit(data: { identifier: string; password: string }) {
    setFieldErrors({});
    const parsed = loginBodySchema.safeParse({
      email: data.identifier.trim(),
      password: data.password,
    });
    if (!parsed.success) {
      setFieldErrors(
        fieldErrorsFromZodIssues(parsed.error.issues, {
          email: "identifier",
        }),
      );
      const first = parsed.error.issues[0]?.message;
      toast.error(first ?? "ورودی‌ها را بررسی کنید.");
      return;
    }

    setPending(true);
    try {
      await apiPost("/api/auth/login", parsed.data);
      toast.success("خوش آمدید!");
      const target =
        from && from.startsWith("/") && !from.startsWith("//")
          ? from
          : "/";
      router.push(target);
      router.refresh();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "ورود ناموفق بود.";
      toast.error(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <LoginForm
      fieldErrors={fieldErrors}
      onFieldChange={clearField}
      onSubmit={onSubmit}
      className={pending ? "pointer-events-none opacity-70" : undefined}
    />
  );
}
