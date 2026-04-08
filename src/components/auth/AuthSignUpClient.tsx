"use client";

import { SignUpForm } from "@/components/auth/SignUpForm";
import { apiPost } from "@/features/api/client";
import { signupBodySchema } from "@/lib/validation/auth";
import { fieldErrorsFromZodIssues } from "@/lib/zod-field-errors";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

type FieldKey = "name" | "email" | "password" | "confirmPassword";

export function AuthSignUpClient() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = React.useState<
    Partial<Record<FieldKey, string>>
  >({});
  const [pending, setPending] = React.useState(false);

  function clearField(field: FieldKey) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function onSubmit(data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    setFieldErrors({});
    const parsed = signupBodySchema.safeParse({
      email: data.email.trim(),
      password: data.password,
      confirmPassword: data.confirmPassword,
      name: data.name.trim(),
    });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZodIssues(parsed.error.issues));
      const first = parsed.error.issues[0]?.message;
      toast.error(first ?? "ورودی‌ها را بررسی کنید.");
      return;
    }

    setPending(true);
    try {
      await apiPost("/api/auth/signup", parsed.data);
      toast.success("ثبت‌نام با موفقیت انجام شد.");
      router.push("/profile");
      router.refresh();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "ثبت‌نام ناموفق بود.";
      toast.error(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <SignUpForm
      fieldErrors={fieldErrors}
      onFieldChange={clearField}
      onSubmit={onSubmit}
      className={pending ? "pointer-events-none opacity-70" : undefined}
    />
  );
}
