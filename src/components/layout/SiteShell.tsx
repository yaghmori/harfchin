import Link from "next/link";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-slate-200/80 bg-[var(--card)] px-4 py-3 shadow-sm dark:border-slate-700/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/"
            className="text-lg font-semibold text-teal-700 dark:text-teal-300"
          >
            حرفچین
          </Link>
          <span className="text-sm text-[var(--muted)]">اسم و فامیل آنلاین</span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8">
        {children}
      </main>
    </div>
  );
}
