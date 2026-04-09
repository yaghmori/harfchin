"use client";

import type { ShellAuthMode } from "@/components/layout/shell-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogoutMutation } from "@/hooks/api-mutations";
import { LogIn, LogOut, PencilLine, UserPlus, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useCallback } from "react";
import { toast } from "sonner";

type AppUserMenuProps = {
  mode: ShellAuthMode;
  /** Shown in the top-bar trigger for the signed-in user (e.g. `/avatar.svg`). */
  accountAvatarSrc: string;
};

export function AppUserMenu({ mode, accountAvatarSrc }: AppUserMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const logoutMutation = useLogoutMutation();
  const logoutBusy = logoutMutation.isPending;

  const fromParam =
    pathname && pathname !== "/login" && pathname !== "/signup"
      ? `?from=${encodeURIComponent(pathname)}`
      : "";

  const onLogout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
      toast.success("از حساب کاربری خارج شدید.");
      router.push("/");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خروج ناموفق بود.");
    } finally {
      logoutMutation.reset();
    }
  }, [logoutMutation, router]);

  const menuAria =
    mode === "registered"
      ? "منوی حساب کاربری"
      : mode === "guest"
        ? "منو — حساب مهمان"
        : "منو — ورود یا ثبت‌نام";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 rounded-full border border-border/70 p-0.5 hover:bg-accent/70 data-[popup-open]:bg-accent/70"
            aria-label={menuAria}
          />
        }
      >
        <span className="relative flex size-full overflow-hidden rounded-full bg-muted">
          <Image
            src={accountAvatarSrc}
            alt="آواتار حساب کاربری"
            fill
            className="object-cover"
            sizes="40px"
            unoptimized
          />
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="min-w-46 ">
        {mode === "registered" ? (
          <>
            <DropdownMenuItem
              onClick={() => router.push("/profile")}
              className="gap-2 px-2.5 py-2 font-semibold"
            >
              <UserRound className="size-4 text-primary" aria-hidden />
              پروفایل
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/profile/edit")}
              className="gap-2 px-2.5 py-2 font-semibold"
            >
              <PencilLine className="size-4 text-primary" aria-hidden />
              ویرایش پروفایل
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={logoutBusy}
              onClick={() => void onLogout()}
              className="gap-2 px-2.5 py-2 font-semibold"
            >
              <LogOut className="size-4" aria-hidden />
              خروج از حساب
            </DropdownMenuItem>
          </>
        ) : (
          <>
            {mode === "guest" ? (
              <DropdownMenuLabel className="px-2.5 py-2 text-xs">
                با ورود، امتیاز و پروفایلتان ذخیره می‌شود.
              </DropdownMenuLabel>
            ) : null}
            <DropdownMenuItem
              onClick={() => router.push(`/login${fromParam}`)}
              className="gap-2 px-2.5 py-2 font-semibold"
            >
              <LogIn className="size-4 text-primary" aria-hidden />
              ورود
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/signup${fromParam}`)}
              className="gap-2 px-2.5 py-2 font-semibold"
            >
              <UserPlus className="size-4 text-primary" aria-hidden />
              ثبت‌نام
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
