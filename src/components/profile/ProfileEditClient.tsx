"use client";

import { apiPatch } from "@/features/api/client";
import { useSyncErrorToToast } from "@/hooks/use-sync-error-toast";
import { MAX_DISPLAY_NAME_LENGTH } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type ProfileEditClientProps = {
  initialName: string;
  email: string;
};

export function ProfileEditClient({
  initialName,
  email,
}: ProfileEditClientProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName.trim());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useSyncErrorToToast(error);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const trimmed = name.trim();
      if (!trimmed) {
        setError("نام نمایشی را وارد کنید.");
        return;
      }
      setLoading(true);
      try {
        await apiPatch("/api/user/profile", { name: trimmed });
        toast.success("پروفایل ذخیره شد.");
        router.push("/profile");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "خطا");
      } finally {
        setLoading(false);
      }
    },
    [name, router],
  );

  return (
    <div className="mx-auto w-full max-w-lg" dir="rtl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/profile"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            "text-[#7E3AF2] transition-colors hover:bg-violet-100 dark:hover:bg-violet-950/50",
          )}
          aria-label="بازگشت به پروفایل"
        >
          <ArrowRight className="size-6" aria-hidden />
        </Link>
        <h1 className="text-lg font-black text-zinc-900 dark:text-white">
          ویرایش پروفایل
        </h1>
      </div>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-6 rounded-3xl border border-violet-100/80 bg-card p-5 shadow-[var(--game-shadow-sm)] dark:border-violet-900/40 dark:bg-zinc-900/50"
      >
        <div className="space-y-2">
          <Label
            htmlFor="profile-email"
            className="text-sm font-bold text-zinc-700 dark:text-zinc-300"
          >
            ایمیل
          </Label>
          <Input
            id="profile-email"
            type="email"
            value={email}
            readOnly
            disabled
            dir="ltr"
            className="rounded-xl border-violet-100/80 bg-muted/50 font-medium opacity-90 dark:border-violet-900/40"
          />
          <p className="text-xs text-muted-foreground">
            ایمیل برای ورود است و اینجا قابل تغییر نیست.
          </p>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="profile-name"
            className="text-sm font-bold text-zinc-700 dark:text-zinc-300"
          >
            نام نمایشی
          </Label>
          <Input
            id="profile-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            autoComplete="nickname"
            placeholder="مثلاً علی"
            className="rounded-xl border-violet-100/80 bg-white text-right text-base font-semibold dark:border-violet-900/40 dark:bg-zinc-950"
          />
          <p className="text-xs text-muted-foreground">
            این نام در بازی و لابی به دیگران نشان داده می‌شود.
          </p>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-full text-base font-bold"
        >
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden />
              در حال ذخیره…
            </>
          ) : (
            "ذخیره تغییرات"
          )}
        </Button>
      </form>
    </div>
  );
}
