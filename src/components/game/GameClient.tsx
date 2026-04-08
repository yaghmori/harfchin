"use client";

import { validateAnswerForLetter } from "@/domain/rules/answer-validation";
import { GameBottomNav } from "@/components/game/GameBottomNav";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiGet, apiPost } from "@/features/api/client";
import { POLL_INTERVAL_MS } from "@/lib/constants";
import { faDigits } from "@/lib/format";
import {
  Apple,
  Briefcase,
  Building2,
  Car,
  Flower2,
  Hand,
  MapPin,
  Palette,
  PawPrint,
  PenLine,
  Sparkles,
  Star,
  User,
  Users,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSyncErrorToToast } from "@/hooks/use-sync-error-toast";
import type { LucideIcon } from "lucide-react";

type AnswerRow = {
  categoryKey: string;
  value: string;
  normalizedValue: string;
  isValid: boolean;
  score: number;
};

type PlayerRow = {
  id: string;
  displayName: string;
  isHost: boolean;
  answers: AnswerRow[];
};

type GamePayload = {
  meUserId: string;
  meRoomPlayerId: string | null;
  hostUserId: string;
  phase: "none" | "playing" | "processing_round" | "finished";
  roomStatus: string;
  game: {
    id: string;
    status: string;
    currentRound: number;
    totalRounds: number;
    roundTimeSec: number;
  } | null;
  round: {
    id: string;
    roundNumber: number;
    letter: string;
    status: string;
    startedAt: string;
    endedAt: string | null;
    endsAt: string;
  } | null;
  players: PlayerRow[];
  leaderboard: {
    roomPlayerId: string;
    displayName: string;
    totalScore: number;
  }[];
  categories: { key: string; title: string }[];
};

function categoryIcon(key: string): LucideIcon {
  const map: Record<string, LucideIcon> = {
    first_name: User,
    last_name: Users,
    city: MapPin,
    country: Building2,
    food: Utensils,
    animal: PawPrint,
    fruit: Apple,
    body_parts: User,
    objects: Sparkles,
    occupation: Briefcase,
    vehicle: Car,
    color: Palette,
    flower_plant: Flower2,
  };
  return map[key] ?? PenLine;
}

function categoryPlaceholder(key: string, letter: string): string {
  const map: Record<string, string> = {
    first_name: "چیزی بنویسید…",
    last_name: "چیزی بنویسید…",
    animal: "مثلاً: ببر",
    fruit: "چیزی بنویسید…",
    city: "چیزی بنویسید…",
    country: "چیزی بنویسید…",
    food: "چیزی بنویسید…",
  };
  return map[key] ?? `با حرف «${letter}»…`;
}

function TimerRing({
  progress,
  className,
}: {
  /** 0 = empty, 1 = full time remaining */
  progress: number;
  className?: string;
}) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, progress)));
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      aria-hidden
    >
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="var(--color-ka-surface-container-high)"
        strokeWidth="8"
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="var(--color-ka-primary)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        className="transition-[stroke-dashoffset] duration-700 ease-linear"
      />
    </svg>
  );
}

export function GameClient({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const [state, setState] = useState<GamePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({});
  const [waitHint, setWaitHint] = useState<string | null>(null);

  useSyncErrorToToast(error);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<GamePayload>(
        `/api/game/state?roomCode=${encodeURIComponent(roomCode)}`,
      );
      setState(data);
      setError(null);
      if (data.phase === "none" || !data.game) {
        router.replace(`/lobby/${roomCode}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    }
  }, [roomCode, router]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (state?.phase === "finished" && state.game?.id) {
      router.replace(`/results/${state.game.id}`);
    }
  }, [state?.phase, state?.game?.id, router]);

  const isHost = state?.hostUserId === state?.meUserId;

  useEffect(() => {
    if (!state?.categories) return;
    setForm((prev) => {
      const next = { ...prev };
      for (const c of state.categories) {
        if (next[c.key] === undefined) next[c.key] = "";
      }
      return next;
    });
  }, [state?.categories]);

  const secondsLeft =
    state?.round == null
      ? 0
      : Math.max(
          0,
          Math.ceil(
            (new Date(state.round.endsAt).getTime() - Date.now()) / 1000,
          ),
        );

  void tick;

  async function completeRoundAction() {
    if (!state?.game) return;
    const allFilled =
      state.categories.length > 0 &&
      state.categories.every((c) => (form[c.key] ?? "").trim().length > 0);
    if (!isHost && !allFilled) return;

    setBusy(true);
    setWaitHint(null);
    try {
      const answers = state.categories.map((c) => ({
        categoryKey: c.key,
        value: form[c.key] ?? "",
      }));
      const res = await apiPost<
        | { outcome: "game_finished"; gameId: string }
        | { outcome: "round_advanced"; gameId: string }
        | {
            outcome: "waiting_for_players";
            readyCount: number;
            totalPlayers: number;
          }
      >("/api/game/complete-round", { roomCode, answers });

      if (res.outcome === "game_finished") {
        router.push(`/results/${res.gameId}`);
        return;
      }
      if (res.outcome === "waiting_for_players") {
        setWaitHint(
          `${faDigits(res.readyCount)} از ${faDigits(res.totalPlayers)} نفر آماده‌اند؛ منتظر بقیه…`,
        );
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  if (error && !state) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-5"
        dir="rtl"
      >
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Link
          href="/"
          className="text-sm font-semibold text-ka-primary underline-offset-4 hover:underline"
        >
          خانه
        </Link>
      </div>
    );
  }

  if (state?.phase === "finished" && state.game) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-ka-surface px-5 text-ka-on-surface">
        <p className="font-medium text-ka-on-surface-variant">
          در حال انتقال به نتایج نهایی…
        </p>
      </div>
    );
  }

  if (!state?.game || !state.round) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center bg-background px-5 text-muted-foreground"
        dir="rtl"
      >
        <p className="text-center text-sm font-medium">در حال اتصال به بازی…</p>
      </div>
    );
  }

  const game = state.game;
  const round = state.round;
  const g = state;
  const phase = g.phase;
  const letter = round.letter;

  const allFieldsFilled =
    g.categories.length > 0 &&
    g.categories.every((c) => (form[c.key] ?? "").trim().length > 0);
  const canComplete = isHost || allFieldsFilled;

  const timerProgress =
    game.roundTimeSec > 0
      ? Math.min(1, secondsLeft / game.roundTimeSec)
      : 0;

  const mePlayer =
    g.meRoomPlayerId == null
      ? null
      : (g.players.find((p) => p.id === g.meRoomPlayerId) ?? null);

  const myBoardScore =
    g.leaderboard.find((l) => l.roomPlayerId === g.meRoomPlayerId)
      ?.totalScore ?? 0;

  const displayInitial =
    mePlayer?.displayName?.trim().slice(0, 1) ?? letter ?? "?";

  const playingChrome = (
    <>
      <header className="fixed top-0 z-50 flex w-full items-center justify-between bg-white/80 px-5 py-4 shadow-[0_12px_32px_rgba(25,28,29,0.06)] backdrop-blur-xl dark:bg-zinc-950/80">
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ka-primary-fixed font-heading text-lg font-black text-ka-on-primary-fixed"
            aria-hidden
          >
            {displayInitial}
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg font-black tracking-tight text-ka-primary">
              حرفچین
            </span>
            <span className="text-[10px] font-medium text-ka-on-surface-variant opacity-80">
              اتاق{" "}
              <span className="font-mono font-bold" dir="ltr">
                {roomCode}
              </span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-ka-secondary-container px-3.5 py-1.5 font-heading text-sm font-semibold text-ka-on-secondary-container">
          <span>{faDigits(myBoardScore)} امتیاز</span>
          <Star className="size-4 fill-amber-600 text-amber-700" aria-hidden />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 space-y-8 px-5 pb-40 pt-24">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {waitHint ? (
          <p className="text-center text-sm font-medium text-ka-primary">
            {waitHint}
          </p>
        ) : null}

        <header className="flex flex-col items-center space-y-5 pt-2">
          <div className="relative flex size-48 items-center justify-center">
            <TimerRing
              progress={timerProgress}
              className="absolute inset-0 size-full"
            />
            <div className="relative z-10 flex size-36 items-center justify-center rounded-full bg-ka-surface-container-lowest ka-kinetic-shadow">
              <span className="font-heading text-7xl font-black leading-none text-ka-primary sm:text-8xl">
                {letter}
              </span>
            </div>
            <div className="absolute bottom-1 z-20 rounded-full bg-ka-secondary-container px-4 py-1 font-heading text-lg font-bold text-ka-on-secondary-container shadow-md">
              {faDigits(secondsLeft)} ثانیه
            </div>
          </div>
          <div className="space-y-1 text-center">
            <h1 className="font-heading text-2xl font-black text-ka-on-surface">
              در حال بازی…
            </h1>
            <p className="text-sm font-medium text-ka-on-surface-variant opacity-[0.85]">
              همه کلمات باید با حرف «{letter}» شروع شوند
            </p>
          </div>
        </header>

        <section className="space-y-3.5">
          {g.categories.map((c) => {
            const raw = form[c.key] ?? "";
            const { isValid } = validateAnswerForLetter(raw, letter);
            const filled = raw.trim().length > 0;
            const Icon = categoryIcon(c.key);
            const highlighted = filled && isValid;
            return (
              <Card
                key={c.key}
                size="sm"
                className={
                  highlighted
                    ? "group border-2 border-ka-primary/25 bg-violet-50/90 dark:bg-violet-950/25"
                    : "group border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                }
              >
                <CardHeader className="space-y-0 pb-2">
                  <CardTitle
                    className={
                      highlighted
                        ? "text-xs font-bold tracking-wide text-ka-primary uppercase"
                        : "text-xs font-bold tracking-wide text-zinc-400 uppercase"
                    }
                  >
                    {c.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-3 pt-0">
                  {highlighted ? (
                    <Icon
                      className="size-6 shrink-0 text-ka-primary"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  ) : (
                    <Icon
                      className="size-6 shrink-0 text-zinc-300 transition-colors group-focus-within:text-ka-primary"
                      aria-hidden
                    />
                  )}
                  <Input
                    id={`cat-${c.key}`}
                    value={raw}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [c.key]: e.target.value }))
                    }
                    dir="auto"
                    autoComplete="off"
                    placeholder={categoryPlaceholder(c.key, letter)}
                    className="h-auto border-0 bg-transparent p-0 text-base font-semibold shadow-none focus-visible:ring-0 dark:bg-transparent"
                  />
                </CardContent>
              </Card>
            );
          })}
        </section>

        <p className="text-center text-xs text-ka-on-surface-variant">
          <Link
            href={`/lobby/${roomCode}`}
            className="text-xs font-medium text-ka-on-surface-variant underline-offset-4 hover:underline"
          >
            بازگشت به لابی
          </Link>
        </p>
      </main>

      <div className="fixed bottom-0 left-0 z-50 w-full">
        <div className="relative z-20 flex justify-center pb-1">
          <Button
            type="button"
            size="lg"
            onClick={() => void completeRoundAction()}
            disabled={busy || !canComplete}
            className="ka-kinetic-shadow-lg h-auto gap-3 rounded-full px-10 py-5 font-heading text-xl font-black shadow-lg"
          >
            <span>پایان دور</span>
            <Hand className="size-7" aria-hidden />
          </Button>
        </div>
        <GameBottomNav active="game" />
      </div>
    </>
  );

  if (phase === "processing_round") {
    return (
      <div
        className="flex min-h-dvh flex-col bg-ka-surface pb-24 text-ka-on-surface"
        dir="rtl"
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5">
          <div
            className="size-12 animate-spin rounded-full border-4 border-ka-primary/20 border-t-ka-primary"
            aria-hidden
          />
          <p className="max-w-sm text-center text-sm font-medium text-ka-on-surface-variant">
            در حال پایان دور و محاسبه امتیاز…
          </p>
        </div>
        <div className="fixed bottom-0 left-0 z-50 w-full">
          <GameBottomNav active="game" />
        </div>
      </div>
    );
  }

  if (phase === "playing") {
    return (
      <div className="flex min-h-dvh flex-col bg-ka-surface text-ka-on-surface">
        {playingChrome}
      </div>
    );
  }

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center bg-ka-surface px-5 text-ka-on-surface"
      dir="rtl"
    >
      <p className="text-center text-sm text-ka-on-surface-variant">
        وضعیت بازی به‌روزرسانی می‌شود…
      </p>
      <div className="fixed bottom-0 left-0 z-50 w-full">
        <GameBottomNav active="game" />
      </div>
    </div>
  );
}
