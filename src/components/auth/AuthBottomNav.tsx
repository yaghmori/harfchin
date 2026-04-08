import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthBottomNavProps = {
  active: "login" | "signup";
};

export function AuthBottomNav({ active }: AuthBottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-[3rem] bg-white/90 px-8 pt-3 pb-6 shadow-[0_-8px_24px_rgba(0,0,0,0.04)] backdrop-blur-md md:hidden dark:bg-zinc-900/90"
      aria-label="ناوبری ورود و ثبت‌نام"
    >
      <Link
        href="/login"
        className={cn(
          "flex flex-col items-center justify-center rounded-full px-6 py-1.5 transition-transform duration-300 ease-out",
          active === "login"
            ? "scale-105 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-200"
            : "text-zinc-400 hover:text-violet-500 dark:text-zinc-500",
        )}
      >
        <LogIn className="size-6" aria-hidden />
        <span className="mt-0.5 font-sans text-[11px] font-semibold">
          Login
        </span>
      </Link>
      <Link
        href="/signup"
        className={cn(
          "flex flex-col items-center justify-center rounded-full px-6 py-1.5 transition-transform duration-300 ease-out",
          active === "signup"
            ? "scale-105 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-200"
            : "text-zinc-400 hover:text-violet-500 dark:text-zinc-500",
        )}
      >
        <UserPlus className="size-6" aria-hidden />
        <span className="mt-0.5 font-sans text-[11px] font-semibold">
          Sign Up
        </span>
      </Link>
    </nav>
  );
}
