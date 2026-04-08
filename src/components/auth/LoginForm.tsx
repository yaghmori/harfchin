"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Apple, Lock, LogIn, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

const GOOGLE_ICON =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAukGmyZ5uZ5aU3pyMOe4uoP4nlpAHO5IFF8bw_QBGiiUg7LmCkY8DnRRPX0knwMdDl7xtguK-_5Q576RTRpyz0luWiccy5KMIT3bcK-a8avnTf3REf9Rd7Nu4m6AqSn3KnZZQAOsDYvfTF2kk4GhSCSOXguqulZBAJevn3Jtk4zq1zEy2sEL1AY858bfmXoSy2Ez0kYGY1-dohqtLb7Yk0nYkO55CAqPq-Xu1t8se4uOuChSqDydAHiVR7jpYf5XUzcOP9A522LG8";

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

  function oauthSoon() {
    toast.info("ورود با گوگل و اپل به‌زودی فعال می‌شود.");
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
          ایمیل
        </Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 inset-s-3 z-10 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="login-identifier"
            name="identifier"
            type="email"
            autoComplete="email"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              onFieldChange?.("identifier");
            }}
            placeholder="مثلاً user@email.com"
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

      <div className="flex items-center gap-3 py-2">
        <Separator className="flex-1" />
        <span className="shrink-0 text-xs font-semibold uppercase tracking-tighter text-muted-foreground">
          یا با استفاده از
        </span>
        <Separator className="flex-1" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={oauthSoon}
        >
          <Image
            src={GOOGLE_ICON}
            alt=""
            width={20}
            height={20}
            className="size-5"
            unoptimized
          />
          گوگل
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={oauthSoon}
        >
          <Apple className="size-5 text-foreground" aria-hidden />
          اپل
        </Button>
      </div>
    </form>
  );
}
