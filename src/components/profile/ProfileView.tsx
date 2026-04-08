import { AchievementMiniCard } from "@/components/profile/AchievementMiniCard";
import { ProfileLogoutButton } from "@/components/profile/ProfileLogoutButton";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { getProfileForUser } from "@/server/services/profile.service";
import { Gamepad2, HelpCircle, PencilLine, UserRound } from "lucide-react";
import Link from "next/link";

type ProfilePayload = NonNullable<Awaited<ReturnType<typeof getProfileForUser>>>;

const resultToneClass = {
  win: "text-amber-600 dark:text-amber-400",
  podium: "text-zinc-800 dark:text-zinc-200",
  loss: "text-red-600 dark:text-red-400",
  neutral: "text-violet-600 dark:text-violet-300",
} as const;

function RecentIcon({ i }: { i: number }) {
  const icons = [Gamepad2, UserRound, HelpCircle] as const;
  const Icon = icons[i % icons.length];
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-violet-100 text-[#7E3AF2] dark:bg-violet-950/80 dark:text-violet-300">
      <Icon className="size-5" aria-hidden />
    </span>
  );
}

export function ProfileView({ data }: { data: ProfilePayload }) {
  const displayName = data.user.name?.trim() || "بازیکن";
  const initial = displayName.charAt(0) || "?";
  const scoreStr = data.totalScore.toLocaleString("fa-IR");
  const gamesStr = data.gamesCount.toLocaleString("fa-IR");
  const winsStr = data.winsCount.toLocaleString("fa-IR");
  const levelStr = data.level.toLocaleString("fa-IR");

  return (
    <div className="text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-between gap-3">
          <span className="w-10 shrink-0" aria-hidden />
          <h1 className="flex-1 text-center text-lg font-black text-zinc-900 dark:text-white">
            پروفایل کاربری
          </h1>
          <Link
            href="/profile/edit"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "shrink-0 text-[#7E3AF2] hover:bg-violet-100 dark:hover:bg-violet-950/50",
            )}
            aria-label="ویرایش پروفایل"
          >
            <PencilLine className="size-5" aria-hidden />
          </Link>
        </div>
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
            <div
              className="rounded-full bg-[conic-gradient(from_180deg,#7E3AF2,#f97316,#7E3AF2)] p-[3px] shadow-[0_12px_32px_rgba(126,58,242,0.25)]"
              aria-hidden
            >
              <div className="flex size-28 items-center justify-center rounded-full bg-white dark:bg-zinc-900">
                <span className="text-4xl font-black text-[#7E3AF2]">
                  {initial}
                </span>
              </div>
            </div>
            <span className="absolute -bottom-1 left-1/2 z-[1] -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold text-amber-950 shadow-sm">
              سطح {levelStr}
            </span>
          </div>
          <h2 className="mt-3 text-xl font-extrabold text-zinc-900 dark:text-white">
            {displayName}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {data.memberSinceLabel}
          </p>
          <Link
            href="/profile/edit"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50 px-4 py-2 text-sm font-bold text-[#7E3AF2] transition-colors hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:hover:bg-violet-900/40"
          >
            <PencilLine className="size-4" aria-hidden />
            ویرایش پروفایل
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-violet-100/80 bg-white p-3 text-center shadow-[0_4px_14px_rgba(0,0,0,0.04)] dark:border-violet-900/40 dark:bg-zinc-900/60">
            <p className="text-lg font-black text-zinc-900 dark:text-white">
              {scoreStr}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              امتیاز کل
            </p>
          </div>
          <div className="rounded-2xl bg-[#7E3AF2] p-3 text-center text-white shadow-[0_8px_20px_rgba(126,58,242,0.35)]">
            <p className="text-lg font-black">{gamesStr}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-white/90">
              بازی‌ها
            </p>
          </div>
          <div className="rounded-2xl border border-violet-100/80 bg-white p-3 text-center shadow-[0_4px_14px_rgba(0,0,0,0.04)] dark:border-violet-900/40 dark:bg-zinc-900/60">
            <p className="text-lg font-black text-zinc-900 dark:text-white">
              {winsStr}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              بردها
            </p>
          </div>
        </div>

        <section className="mt-10">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div className="text-start">
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                دستاوردها
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                achievements
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-violet-200/80 bg-violet-50 text-xs font-semibold text-[#7E3AF2] hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/50 dark:hover:bg-violet-900/40"
              disabled
            >
              مشاهده همه
            </Button>
          </div>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {data.achievements.map((a) => (
              <AchievementMiniCard
                key={a.key}
                titleFa={a.titleFa}
                icon={a.icon}
                progressPercent={a.progressPercent}
              />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h3 className="mb-3 text-base font-extrabold text-zinc-900 dark:text-white">
            آخرین بازی‌ها
          </h3>
          <ul className="space-y-3">
            {data.recentGames.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-violet-200/80 bg-violet-50/40 px-4 py-8 text-center text-sm text-zinc-500 dark:border-violet-900/50 dark:bg-violet-950/20 dark:text-zinc-400">
                هنوز بازی ثبت نشده. از{" "}
                <Link
                  href="/create"
                  className="font-bold text-[#7E3AF2] underline-offset-2 hover:underline"
                >
                  ساخت اتاق
                </Link>{" "}
                شروع کنید.
              </li>
            ) : (
              data.recentGames.map((g, i) => (
                <li
                  key={g.id}
                  className="flex items-center gap-3 rounded-2xl border border-violet-100/80 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)] dark:border-violet-900/40 dark:bg-zinc-900/60"
                >
                  <RecentIcon i={i} />
                  <div className="min-w-0 flex-1 text-start">
                    <p className="truncate font-bold text-zinc-900 dark:text-white">
                      {g.title}
                    </p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {g.subtitle} · {g.at}
                    </p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p
                      className={`text-sm font-bold ${resultToneClass[g.resultTone]}`}
                    >
                      {g.resultLabel}
                    </p>
                    <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      {g.points.toLocaleString("fa-IR")} امتیاز
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <div className="mt-8 flex justify-center pb-2">
          <ProfileLogoutButton />
        </div>
      </main>
    </div>
  );
}
