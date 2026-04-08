"use client";

import { apiPost } from "@/features/api/client";
import { cn } from "@/lib/utils";
import type { ShellAuthMode } from "@/components/layout/shell-auth";
import {
  LogIn,
  LogOut,
  PencilLine,
  UserPlus,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type AppUserMenuProps = {
  mode: ShellAuthMode;
  userInitial: string;
};

export function AppUserMenu({ mode, userInitial }: AppUserMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [logoutBusy, setLogoutBusy] = useState(false);

  const fromParam =
    pathname && pathname !== "/login" && pathname !== "/signup"
      ? `?from=${encodeURIComponent(pathname)}`
      : "";

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onLogout = useCallback(async () => {
    setLogoutBusy(true);
    try {
      await apiPost<{ ok: boolean }>("/api/auth/logout", {});
      toast.success("از حساب کاربری خارج شدید.");
      setOpen(false);
      router.push("/");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خروج ناموفق بود.");
    } finally {
      setLogoutBusy(false);
    }
  }, [router]);

  const menuAria =
    mode === "registered"
      ? "منوی حساب کاربری"
      : mode === "guest"
        ? "منو — حساب مهمان"
        : "منو — ورود یا ثبت‌نام";

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex size-10 items-center justify-center rounded-full p-0.5 ring-2 ring-violet-200/80 transition-colors hover:bg-violet-50/80",
          "outline-none focus-visible:ring-2 focus-visible:ring-[#7E3AF2] focus-visible:ring-offset-2",
          "dark:ring-violet-800 dark:hover:bg-violet-950/50",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={menuAria}
      >
        <span className="flex size-full items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-sm font-black text-white">
          {userInitial}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute end-0 top-[calc(100%+0.5rem)] z-[60] min-w-[11.5rem] rounded-2xl border border-violet-200/80 bg-card py-1.5 shadow-lg dark:border-violet-900/50 dark:bg-zinc-900"
        >
          {mode === "registered" ? (
            <>
              <MenuLink href="/profile" icon={UserRound} onNavigate={() => setOpen(false)}>
                پروفایل
              </MenuLink>
              <MenuLink href="/profile/edit" icon={PencilLine} onNavigate={() => setOpen(false)}>
                ویرایش پروفایل
              </MenuLink>
              <hr className="my-1 border-violet-100 dark:border-violet-900/60" />
              <button
                type="button"
                role="menuitem"
                disabled={logoutBusy}
                onClick={() => void onLogout()}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <LogOut className="size-4 shrink-0" aria-hidden />
                خروج از حساب
              </button>
            </>
          ) : (
            <>
              {mode === "guest" ? (
                <p className="px-3 py-2 text-xs font-medium text-muted-foreground">
                  با ورود، امتیاز و پروفایلتان ذخیره می‌شود.
                </p>
              ) : null}
              <MenuLink href={`/login${fromParam}`} icon={LogIn} onNavigate={() => setOpen(false)}>
                ورود
              </MenuLink>
              <MenuLink href={`/signup${fromParam}`} icon={UserPlus} onNavigate={() => setOpen(false)}>
                ثبت‌نام
              </MenuLink>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
  onNavigate,
}: {
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-violet-50 dark:hover:bg-violet-950/40"
    >
      <Icon className="size-4 shrink-0 text-[#7E3AF2]" aria-hidden />
      {children}
    </Link>
  );
}
