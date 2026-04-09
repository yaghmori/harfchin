"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Lock, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import * as React from "react";

type LoginFormProps = {
  className?: string;
  fieldErrors?: Partial<Record<"identifier" | "password", string>>;
  onFieldChange?: (field: "identifier" | "password") => void;
  onSubmit?: (data: { identifier: string; password: string }) => void;
};

export function LoginForm({
  className,
  fieldErrors,
  onFieldChange,
  onSubmit,
}: LoginFormProps) {
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit?.({ identifier, password });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("w-full space-y-6", className)}
      noValidate
    >
      <div className="space-y-2">
        <Label
          htmlFor="login-identifier"
          className="text-xs uppercase tracking-widest"
        >
          نام کاربری یا ایمیل
        </Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 inset-s-3 z-10 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="login-identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              onFieldChange?.("identifier");
            }}
            placeholder="مثلاً arash.r یا user@email.com"
            className="ps-11"
            aria-invalid={Boolean(fieldErrors?.identifier)}
            aria-describedby={
              fieldErrors?.identifier ? "login-identifier-error" : undefined
            }
          />
        </div>
        {fieldErrors?.identifier ? (
          <p
            id="login-identifier-error"
            className="text-sm font-medium text-destructive"
            role="alert"
          >
            {fieldErrors.identifier}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="login-password"
          className="text-xs uppercase tracking-widest"
        >
          رمز عبور
        </Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 inset-s-3 z-10 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              onFieldChange?.("password");
            }}
            placeholder="••••••••"
            className="ps-11"
            aria-invalid={Boolean(fieldErrors?.password)}
            aria-describedby={
              fieldErrors?.password ? "login-password-error" : undefined
            }
          />
        </div>
        {fieldErrors?.password ? (
          <p
            id="login-password-error"
            className="text-sm font-medium text-destructive"
            role="alert"
          >
            {fieldErrors.password}
          </p>
        ) : null}
        <div className="text-start">
          <Link
            href="#"
            className={cn(
              buttonVariants({ variant: "link" }),
              "h-auto p-0 text-sm",
            )}
          >
            فراموشی رمز عبور؟
          </Link>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full">
        <span>ورود به حساب کاربری</span>
        <LogIn className="size-5" aria-hidden />
      </Button>
    </form>
  );
}
