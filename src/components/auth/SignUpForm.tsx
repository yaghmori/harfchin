"use client";

import { Lock, Mail, User, UserPlus } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SignUpField = "name" | "email" | "password";

type SignUpFormProps = {
  className?: string;
  fieldErrors?: Partial<Record<SignUpField, string>>;
  onFieldChange?: (field: SignUpField) => void;
  onSubmit?: (data: {
    name: string;
    email: string;
    password: string;
  }) => void;
};

export function SignUpForm({
  className,
  fieldErrors,
  onFieldChange,
  onSubmit,
}: SignUpFormProps) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit?.({ name, email, password });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("w-full space-y-6", className)}
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="signup-name" className="text-xs uppercase tracking-widest">
          نام نمایشی
        </Label>
        <div className="relative">
          <User
            className="pointer-events-none absolute top-1/2 inset-s-3 z-10 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="signup-name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              onFieldChange?.("name");
            }}
            placeholder="مثلاً آرش بهرامی"
            className="ps-11"
            aria-invalid={Boolean(fieldErrors?.name)}
            aria-describedby={
              fieldErrors?.name ? "signup-name-error" : undefined
            }
          />
        </div>
        {fieldErrors?.name ? (
          <p
            id="signup-name-error"
            className="text-sm font-medium text-destructive"
            role="alert"
          >
            {fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-xs uppercase tracking-widest">
          ایمیل
        </Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 inset-s-3 z-10 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              onFieldChange?.("email");
            }}
            placeholder="user@email.com"
            className="ps-11"
            aria-invalid={Boolean(fieldErrors?.email)}
            aria-describedby={
              fieldErrors?.email ? "signup-email-error" : undefined
            }
          />
        </div>
        {fieldErrors?.email ? (
          <p
            id="signup-email-error"
            className="text-sm font-medium text-destructive"
            role="alert"
          >
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-xs uppercase tracking-widest">
          رمز عبور
        </Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 inset-s-3 z-10 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              onFieldChange?.("password");
            }}
            placeholder="••••••••"
            className="ps-11"
            aria-invalid={Boolean(fieldErrors?.password)}
            aria-describedby={
              fieldErrors?.password ? "signup-password-error" : undefined
            }
          />
        </div>
        {fieldErrors?.password ? (
          <p
            id="signup-password-error"
            className="text-sm font-medium text-destructive"
            role="alert"
          >
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="w-full">
        <span>ایجاد حساب کاربری</span>
        <UserPlus className="size-5" aria-hidden />
      </Button>
    </form>
  );
}
