import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/home/SectionHeader";
import { StatCard } from "@/components/home/StatCard";
import type { DirectoryRoom } from "@/lib/room-directory";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  Coins,
  Medal,
  Plus,
  Rocket,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

function formatFaInt(n: number) {
  return n.toLocaleString("fa-IR", { useGrouping: false });
}

function firstGrapheme(s: string) {
  const g = Array.from(s.trim())[0];
  return g ?? "?";
}

function avatarHue(name: string) {
  const hues = [265, 200, 35, 310, 145, 190];
  let s = 0;
  for (let i = 0; i < name.length; i++) s += name.charCodeAt(i);
  return hues[s % hues.length];
}

const WEEKLY_LEADERBOARD_PLACEHOLDER = [
  { name: "سارا احمدی", score: 2840 },
  { name: "امیر کاظمی", score: 2510 },
  { name: "نازنین رضایی", score: 2395 },
] as const;

type HomeDashboardProps = {
  greetName: string;
  level: number;
  coins: number;
  rooms: DirectoryRoom[];
};

export function HomeDashboard({
  greetName,
  level,
  coins,
  rooms,
}: HomeDashboardProps) {
  const levelStr = formatFaInt(level);
  const coinsStr = `${formatFaInt(coins)} سکه`;

  return (
    <div className="relative flex flex-1 flex-col gap-6 pb-4">
      <section className="space-y-1 pt-1 text-start">
        <h2 className="text-2xl font-black tracking-tight text-foreground">
          سلام {greetName}، خوش اومدی!
        </h2>
        <p className="text-sm font-medium text-muted-foreground">
          آماده‌ای برای رقابت امروز؟
        </p>
      </section>

      <div className="flex gap-3">
        <StatCard
          label="موجودی"
          value={coinsStr}
          icon={Coins}
          iconWrapperClassName="bg-amber-100 dark:bg-amber-950/50 [&_svg]:text-amber-600 dark:[&_svg]:text-amber-400"
        />
        <StatCard
          label="سطح شما"
          value={`سطح ${levelStr}`}
          icon={Medal}
        />
      </div>

      <Link
        href="/rooms"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-[#630ed4] to-[#7c3aed] p-5 text-white shadow-[0_12px_32px_rgba(99,14,212,0.35)] transition-[transform,filter] hover:brightness-[1.03] active:scale-[0.99]"
      >
        <Badge className="absolute end-3 top-3 border-0 bg-white/20 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/25">
          امتیاز ۲ برابر
        </Badge>
        <div className="flex items-center gap-4">
          <span
            className="grid size-14 shrink-0 place-items-center text-3xl"
            aria-hidden
          >
            🚀
          </span>
          <div className="min-w-0 flex-1 text-start">
            <p className="text-lg font-black">شروع بازی سریع</p>
            <p className="mt-1 text-sm font-medium text-white/85">
              همین حالا با بازیکن‌های آنلاین رقابت کن
            </p>
          </div>
        </div>
        <Rocket
          className="pointer-events-none absolute -bottom-2 -start-6 size-24 rotate-12 text-white/10"
          aria-hidden
        />
      </Link>

      <section>
        <SectionHeader
          title="اتاق‌های فعال"
          actionHref="/rooms"
          actionLabel="مشاهده همه"
        />
        <ul className="flex flex-col gap-3">
          {rooms.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-violet-200/80 bg-violet-50/50 px-4 py-8 text-center text-sm text-muted-foreground dark:border-violet-900/50 dark:bg-violet-950/20">
              هنوز اتاق فعالی نیست.{" "}
              <Link href="/create" className="font-bold text-[#7E3AF2] underline-offset-2 hover:underline">
                اولین اتاق را بسازید
              </Link>
            </li>
          ) : (
            rooms.map((room, i) => {
              const Icon = i % 2 === 0 ? Users : Zap;
              const playing = room.status === "playing";
              return (
                <li key={room.roomCode}>
                  <Link
                    href={`/join?code=${encodeURIComponent(room.roomCode)}`}
                    className="flex items-center gap-3 rounded-2xl bg-muted/80 p-4 transition-colors hover:bg-muted dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-card shadow-sm dark:bg-zinc-900">
                      <Icon
                        className="size-5 text-[#7E3AF2] dark:text-violet-400"
                        aria-hidden
                      />
                    </span>
                    <div className="min-w-0 flex-1 text-start">
                      <p className="font-bold text-foreground">{room.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {playing ? "در حال بازی" : "در انتظار بازیکن"}
                        {" · "}
                        میزبان {room.hostLabel}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-muted-foreground">
                      {formatFaInt(room.playerCount)}/
                      {formatFaInt(room.maxPlayers)} بازیکن
                      <ChevronLeft
                        className="size-5 text-[#7E3AF2] opacity-80"
                        aria-hidden
                      />
                    </span>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <section className="rounded-3xl border border-violet-100/80 bg-card p-4 shadow-[var(--game-shadow-sm)] dark:border-violet-900/40 dark:bg-zinc-900/50">
        <div className="mb-4 flex items-start justify-between gap-2">
          <Badge
            variant="secondary"
            className="rounded-full border-0 bg-violet-100 text-xs font-bold text-[#7E3AF2] dark:bg-violet-950 dark:text-violet-300"
          >
            ۲ روز مانده
          </Badge>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-foreground">
              رده‌بندی هفته
            </h2>
            <Trophy
              className="size-5 shrink-0 text-amber-500"
              aria-hidden
            />
          </div>
        </div>
        <ol className="space-y-3">
          {WEEKLY_LEADERBOARD_PLACEHOLDER.map((row, idx) => {
            const rank = idx + 1;
            const initial = firstGrapheme(row.name);
            const hue = avatarHue(row.name);
            return (
              <li
                key={row.name}
                className="flex items-center gap-3 rounded-2xl bg-muted/50 px-2 py-2 dark:bg-zinc-800/40"
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-black",
                    rank === 1
                      ? "bg-amber-400 text-amber-950"
                      : "bg-violet-100 text-[#7E3AF2] dark:bg-violet-950 dark:text-violet-300",
                  )}
                >
                  {formatFaInt(rank)}
                </div>
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: `hsl(${hue} 52% 42%)` }}
                >
                  {initial}
                </div>
                <div className="min-w-0 flex-1 text-start">
                  <p className="truncate font-bold text-foreground">{row.name}</p>
                  <p className="text-xs text-muted-foreground">امتیاز هفتگی</p>
                </div>
                <span className="shrink-0 font-black text-[#7E3AF2] dark:text-violet-300" dir="ltr">
                  {formatFaInt(row.score)}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          رده‌بندی سراسری به‌زودی به‌روزرسانی زنده می‌شود.
        </p>
      </section>

      <Link
        href="/create"
        className="fixed bottom-24 end-4 z-40 flex size-14 items-center justify-center rounded-full bg-[#7E3AF2] text-white shadow-[0_12px_28px_rgba(126,58,242,0.45)] transition-transform hover:scale-105 active:scale-95 dark:bg-violet-600"
        aria-label="ساخت اتاق جدید"
      >
        <Plus className="size-7 stroke-[2.5]" aria-hidden />
      </Link>
    </div>
  );
}
