import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Button
            variant="ghost"
            render={<Link href="/" />}
            nativeButton={false}
            className="h-auto px-0 text-lg font-semibold text-teal-700 hover:bg-transparent hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200"
          >
            حرفچین
          </Button>
          <span className="text-sm text-muted-foreground">اسم و فامیل آنلاین</span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8">
        {children}
      </main>
    </div>
  );
}
