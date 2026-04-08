import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthTopBarProps = {
  className?: string;
};

export function AuthTopBar({ className }: AuthTopBarProps) {
  return (
    <header
      className={cn(
        "fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-white/80 px-6 shadow-[0_12px_32px_rgba(25,28,29,0.06)] backdrop-blur-xl dark:bg-zinc-950/80",
        className,
      )}
    >
      <Link
        href="/"
        className="flex items-center gap-2 rounded-full p-0.5 transition-transform duration-200 active:scale-90"
        aria-label="بازگشت به صفحه اصلی"
      >
        <ArrowRight className="size-6 cursor-pointer rounded-full p-2 text-violet-600 transition-colors hover:bg-zinc-100/50 dark:text-violet-400 dark:hover:bg-zinc-800/50" />
      </Link>
      <div
        className={cn(
          "bg-gradient-to-l from-violet-700 to-violet-500 bg-clip-text font-sans text-2xl font-black tracking-tight text-transparent dark:from-violet-400 dark:to-violet-300",
        )}
      >
        Kinetic Air
      </div>
      <div className="w-10 shrink-0" aria-hidden />
    </header>
  );
}
