"use client";

import Image from "next/image";
import { Apple, KeyRound, Lock, Mail, User, UserPlus } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const GOOGLE_ICON =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAukGmyZ5uZ5aU3pyMOe4uoP4nlpAHO5IFF8bw_QBGiiUg7LmCkY8DnRRPX0knwMdDl7xtguK-_5Q576RTRpyz0luWiccy5KMIT3bcK-a8avnTf3REf9Rd7Nu4m6AqSn3KnZZQAOsDYvfTF2kk4GhSCSOXguqulZBAJevn3Jtk4zq1zEy2sEL1AY858bfmXoSy2Ez0kYGY1-dohqtLb7Yk0nYkO55CAqPq-Xu1t8se4uOuChSqDydAHiVR7jpYf5XUzcOP9A522LG8";

type SignUpFormProps = {
  className?: string;
  onSubmit?: (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => void;
};

export function SignUpForm({ className, onSubmit }: SignUpFormProps) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit?.({ name, email, password, confirmPassword });
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
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً آرش بهرامی"
            className="ps-11"
          />
        </div>
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
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@email.com"
            className="ps-11"
          />
        </div>
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
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="ps-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-confirm" className="text-xs uppercase tracking-widest">
          تکرار رمز عبور
        </Label>
        <div className="relative">
          <KeyRound
            className="pointer-events-none absolute top-1/2 inset-s-3 z-10 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="signup-confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="ps-11"
          />
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full">
        <span>ایجاد حساب کاربری</span>
        <UserPlus className="size-5" aria-hidden />
      </Button>

      <div className="flex items-center gap-3 py-2">
        <Separator className="flex-1" />
        <span className="shrink-0 text-xs font-semibold uppercase tracking-tighter text-muted-foreground">
          یا با استفاده از
        </span>
        <Separator className="flex-1" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" size="lg" className="w-full">
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
        <Button type="button" variant="outline" size="lg" className="w-full">
          <Apple className="size-5 text-foreground" aria-hidden />
          اپل
        </Button>
      </div>
    </form>
  );
}
