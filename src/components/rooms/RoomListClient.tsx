"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiGet } from "@/features/api/client";
import type { DirectoryRoom } from "@/lib/room-directory";
import { cn } from "@/lib/utils";
import {
  Gamepad2,
  LogIn,
  Plus,
  Search,
  Settings,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type ListPayload = { rooms: DirectoryRoom[] };

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

function difficultyMeta(room: DirectoryRoom) {
  const { draftRoundTimeSec, draftTotalRounds } = room;
  if (draftRoundTimeSec <= 45 || draftTotalRounds >= 12) {
    return { dotClass: "bg-ka-error", label: "خیلی سخت" as const };
  }
  if (draftRoundTimeSec <= 75 || draftTotalRounds >= 8) {
    return { dotClass: "bg-ka-secondary-container", label: "سخت" as const };
  }
  return { dotClass: "bg-[#d2bbff]", label: "معمولی" as const };
}

function roomSubtitle(room: DirectoryRoom) {
  const d = difficultyMeta(room);
  return `${d.label} • ${formatFaInt(room.draftTotalRounds)} دور • زمان ${formatFaInt(room.draftRoundTimeSec)} ثانیه`;
}

type FilterChip = "all" | "waiting" | "playing";

const FILTER_OPTIONS = [
  ["all", "همه"],
  ["waiting", "در انتظار"],
  ["playing", "در حال بازی"],
] as const;

function FilterChipRow({
  filter,
  onFilterChange,
  className,
}: {
  filter: FilterChip;
  onFilterChange: (v: FilterChip) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-2", className)}>
      {FILTER_OPTIONS.map(([key, label]) => (
        <Button
          key={key}
          type="button"
          variant={filter === key ? "secondary" : "outline"}
          size="sm"
          onClick={() => onFilterChange(key)}
          className="shrink-0 rounded-full border-ka-outline-variant/10 font-bold shadow-sm"
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

export function RoomListClient() {
  const [rooms, setRooms] = useState<DirectoryRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterChip>("all");

  const load = useCallback(async () => {
    try {
      const data = await apiGet<ListPayload>("/api/room/list");
      setRooms(data.rooms);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(id);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rooms.filter((r) => {
      if (filter === "waiting" && r.status !== "waiting") return false;
      if (filter === "playing" && r.status !== "playing") return false;
      if (!q) return true;
      const hay = [
        r.roomCode,
        r.title,
        r.hostLabel,
        ...r.players.map((p) => p.displayName),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rooms, query, filter]);

  const onlineLabel = formatFaInt(rooms.length);

  return (
    <div className="min-h-dvh bg-ka-background pb-36 text-ka-on-background">
      <header className="fixed top-0 z-50 flex w-full items-center justify-between bg-white/80 px-6 py-4 shadow-[0_12px_32px_rgba(25,28,29,0.06)] backdrop-blur-xl dark:bg-zinc-950/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-ka-primary-fixed">
            <Gamepad2 className="size-7 text-ka-on-primary-fixed" aria-hidden />
          </div>
          <span className="font-heading text-xl font-bold tracking-tighter text-violet-700 dark:text-violet-300">
            حرفچین
          </span>
        </div>
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          variant="secondary"
          size="sm"
          className="font-semibold text-violet-600 dark:text-violet-400"
        >
          خانه
        </Button>
      </header>

      <main className="mx-auto max-w-4xl px-6 pt-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-ka-on-background sm:text-4xl">
              روم‌های فعال
            </h1>
            <p className="font-medium text-ka-on-surface-variant">
              {loading && rooms.length === 0
                ? "در حال بارگذاری…"
                : `${onlineLabel} روم آنلاین در حال بازی یا انتظار`}
            </p>
            <FilterChipRow
              filter={filter}
              onFilterChange={setFilter}
              className="mt-4 overflow-x-auto pb-1 md:hidden"
            />
          </div>
          <FilterChipRow
            filter={filter}
            onFilterChange={setFilter}
            className="hidden md:flex"
          />
        </div>

        <div className="relative mb-10">
          <div className="pointer-events-none absolute inset-y-0 right-4 z-10 flex items-center">
            <Search className="size-5 text-ka-outline" aria-hidden />
          </div>
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی نام روم، کد یا بازیکن…"
            className="rounded-2xl border-0 bg-ka-surface-container-lowest pe-12 ps-6 text-base font-medium shadow-[0_8px_20px_rgba(0,0,0,0.03)] placeholder:text-ka-on-surface-variant/70 focus-visible:ring-ka-primary/20 sm:text-lg"
            autoComplete="off"
          />
        </div>

        {error ? (
          <Alert
            variant="destructive"
            className="mb-6 border-ka-error-container bg-ka-error-container text-ka-on-error-container *:data-[slot=alert-description]:text-ka-on-error-container"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filtered.map((room) => (
            <RoomCard key={room.roomCode} room={room} />
          ))}
        </div>

        {!loading && filtered.length === 0 ? (
          <p className="mt-10 text-center font-medium text-ka-on-surface-variant">
            {rooms.length === 0
              ? "هنوز روم عمومی فعالی نیست. اولین نفر باشید!"
              : "رومی با این فیلتر پیدا نشد."}
          </p>
        ) : null}

        <section className="group relative mt-12 mb-8 overflow-hidden rounded-xl bg-linear-to-br from-ka-primary to-ka-primary-container p-8">
          <div className="relative z-10 max-w-xs text-white">
            <h2 className="mb-3 text-2xl font-black ">تورنمنت هفتگی</h2>
            <p className="mb-6 text-sm font-medium leading-relaxed text-ka-on-primary-container opacity-90">
              به رقابت بزرگ «اسم‌وفامیل» بپیوندید و شانس برنده شدن ۵۰۰۰ سکه
              طلایی را داشته باشید!
            </p>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              className="text-sm bg-ka-secondary-container font-bold shadow-xl shadow-black/10 hover:scale-105 hover:brightness-[1.02] active:scale-100"
            >
              ثبت‌نام در چالش
            </Button>
          </div>
          <div className="pointer-events-none absolute -left-10 -bottom-10 opacity-20 transition-transform duration-700 group-hover:scale-110 motion-reduce:transition-none">
            <Trophy
              className="size-48 text-white/20"
              strokeWidth={1}
              aria-hidden
            />
          </div>
        </section>
      </main>

      <div className="fixed bottom-32 left-8 z-50">
        <Button
          render={<Link href="/create" />}
          nativeButton={false}
          size="lg"
          className="h-auto gap-3 px-6 py-5 text-lg shadow-[0_16px_40px_rgba(99,14,212,0.3)] hover:scale-110 active:scale-95"
        >
          <Plus className="size-6 stroke-[2.5]" aria-hidden />
          ساخت روم جدید
        </Button>
      </div>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full justify-around rounded-t-[3rem] bg-white/90 px-4 pt-3 pb-6 shadow-[0_-8px_24px_rgba(25,28,29,0.04)] backdrop-blur-lg dark:bg-zinc-950/90">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "h-auto flex-col gap-0 rounded-xl px-5 py-2 text-zinc-400 hover:text-violet-500 dark:text-zinc-500",
          )}
        >
          <Gamepad2 className="size-6" aria-hidden />
          <span className="mt-1 text-[10px] font-bold">بازی</span>
        </Link>
        <span className="flex cursor-default flex-col items-center justify-center rounded-full bg-violet-100 px-5 py-2 text-violet-700 scale-110 dark:bg-violet-900/30 dark:text-violet-200">
          <Users
            className="size-6 fill-violet-700 text-violet-700 dark:fill-violet-200 dark:text-violet-200"
            aria-hidden
          />
          <span className="mt-1 text-[10px] font-bold">روم‌ها</span>
        </span>
        <Link
          href="/join"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "h-auto flex-col gap-0 rounded-xl px-5 py-2 text-zinc-400 hover:text-violet-500 dark:text-zinc-500",
          )}
        >
          <LogIn className="size-6" aria-hidden />
          <span className="mt-1 text-[10px] font-bold">ورود با کد</span>
        </Link>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "h-auto flex-col gap-0 rounded-xl px-5 py-2 text-zinc-400 hover:text-violet-500 dark:text-zinc-500",
          )}
        >
          <Settings className="size-6" aria-hidden />
          <span className="mt-1 text-[10px] font-bold">خانه</span>
        </Link>
      </nav>
    </div>
  );
}

function RoomCard({ room }: { room: DirectoryRoom }) {
  const playing = room.status === "playing";
  const full = room.playerCount >= room.maxPlayers;
  const canEnter = room.status === "waiting" && !full;
  const diff = difficultyMeta(room);
  const shown = room.players.slice(0, 3);
  const extra = Math.max(0, room.playerCount - shown.length);

  return (
    <Card
      className={cn(
        "group/card border-transparent bg-ka-surface-container-lowest p-6 shadow-[0_12px_32px_rgba(25,28,29,0.04)] transition-all duration-300",
        "hover:border-ka-primary/10 hover:shadow-md",
        "gap-6 shadow-none",
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-0">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-xl text-ka-on-background">
            {room.title}
          </CardTitle>
          <CardDescription className="flex items-center gap-2 font-medium text-ka-on-surface-variant">
            <span
              className={cn("h-2 w-2 shrink-0 rounded-full", diff.dotClass)}
            />
            <span>{roomSubtitle(room)}</span>
          </CardDescription>
        </div>
        {playing ? (
          <Badge
            variant="secondary"
            className="shrink-0 rounded-xl border-0 bg-ka-primary-fixed px-3 py-1.5 text-xs font-bold tracking-widest text-ka-on-primary-fixed shadow-none"
          >
            LIVE
          </Badge>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-row items-center justify-between gap-3 p-0">
        <div className="flex -space-x-2 space-x-reverse">
          {shown.map((p) => {
            const h = avatarHue(p.displayName);
            return (
              <div
                key={p.displayName}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ka-surface-container-lowest text-[10px] font-bold text-white"
                style={{ backgroundColor: `hsl(${h} 52% 42%)` }}
                title={p.displayName}
              >
                {firstGrapheme(p.displayName)}
              </div>
            );
          })}
          {extra > 0 ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ka-surface-container-lowest bg-ka-surface-container-high text-[10px] font-bold text-ka-on-background">
              +{formatFaInt(extra)}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="font-bold text-ka-on-surface-variant">
            {formatFaInt(room.playerCount)}/{formatFaInt(room.maxPlayers)}{" "}
            بازیکن
          </span>
          {canEnter ? (
            <Button
              render={
                <Link
                  href={`/join?code=${encodeURIComponent(room.roomCode)}`}
                />
              }
              nativeButton={false}
              size="default"
              className="shadow-lg shadow-ka-primary/20 group-hover/card:scale-105 active:scale-95"
            >
              ورود
            </Button>
          ) : playing ? (
            <Button
              type="button"
              variant="outline"
              disabled
              className="cursor-not-allowed font-bold text-ka-on-background/60 opacity-100"
            >
              در حال بازی
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled
              className="cursor-not-allowed font-bold text-ka-on-background/50 opacity-100"
            >
              پر
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
