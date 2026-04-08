"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/features/api/client";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function ProfileLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onLogout() {
    setPending(true);
    try {
      await apiPost<{ ok: boolean }>("/api/auth/logout", {});
      toast.success("از حساب کاربری خارج شدید.");
      router.push("/");
      router.refresh();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "خروج ناموفق بود.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2 rounded-full border-violet-200 text-violet-800 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-200 dark:hover:bg-violet-950/50"
      disabled={pending}
      onClick={onLogout}
    >
      <LogOut className="size-4" aria-hidden />
      خروج از حساب
    </Button>
  );
}
