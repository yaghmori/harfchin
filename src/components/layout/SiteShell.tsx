import { Button } from "@/components/ui/button";
import { LogIn, UserRound } from "lucide-react";
import Link from "next/link";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="game-surface flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-border/30 bg-card/75 px-4 py-3 shadow-[var(--game-shadow-sm)] backdrop-blur-md backdrop-saturate-150">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Button
            variant="ghost"
            render={<Link href="/" />}
            nativeButton={false}
            className="h-auto rounded-xl px-2 py-1.5 text-lg font-bold text-[var(--game-blue-dark)] hover:bg-[var(--game-blue)]/10 hover:text-[var(--game-blue-dark)] dark:text-[var(--game-blue)]"
          >
            حرفچین
          </Button>
          <span className="max-w-[40%] truncate text-xs font-medium text-muted-foreground sm:max-w-[50%] sm:text-sm">
            اسم و فامیل آنلاین
          </span>
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              render={<Link href="/login" />}
              nativeButton={false}
              className="text-muted-foreground hover:text-foreground"
              aria-label="ورود"
            >
              <LogIn className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              render={<Link href="/profile" />}
              nativeButton={false}
              className="text-muted-foreground hover:text-foreground"
              aria-label="پروفایل"
            >
              <UserRound className="size-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
