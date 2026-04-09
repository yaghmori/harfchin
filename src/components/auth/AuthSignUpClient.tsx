"use client";

import { SignUpForm } from "@/components/auth/SignUpForm";
import { useSignupMutation } from "@/hooks/api-mutations";
import { signupBodySchema } from "@/lib/validation/auth";
import { fieldErrorsFromZodIssues } from "@/lib/zod-field-errors";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

type FieldKey = "name" | "email" | "password";

export function AuthSignUpClient() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = React.useState<
    Partial<Record<FieldKey, string>>
  >({});
  const signupMutation = useSignupMutation();

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
  }) {
    setFieldErrors({});
    const parsed = signupBodySchema.safeParse({
      email: data.email.trim(),
      password: data.password,
      name: data.name.trim(),
    });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZodIssues(parsed.error.issues));
      const first = parsed.error.issues[0]?.message;
      toast.error(first ?? "ورودی‌ها را بررسی کنید.");
      return;
    }

    try {
      await signupMutation.mutateAsync(parsed.data);
      toast.success("ثبت‌نام با موفقیت انجام شد.");
      router.push("/profile");
      router.refresh();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "ثبت‌نام ناموفق بود.";
      toast.error(msg);
    } finally {
      signupMutation.reset();
    }
  }

  return (
    <SignUpForm
      fieldErrors={fieldErrors}
      onFieldChange={clearField}
      onSubmit={onSubmit}
      className={
        signupMutation.isPending ? "pointer-events-none opacity-70" : undefined
      }
    />
  );
}
