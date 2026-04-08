"use client";

import { validateAnswerForLetter } from "@/domain/rules/answer-validation";
import { SiteShell } from "@/components/layout/SiteShell";
import { CategoryPlayerTabs } from "@/components/game/CategoryPlayerTabs";
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
  phase: "none" | "playing" | "review" | "between" | "finished";
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

  async function submitAnswers() {
    if (!state?.game) return;
    setBusy(true);
    try {
      const answers = state.categories.map((c) => ({
        categoryKey: c.key,
        value: form[c.key] ?? "",
      }));
      await apiPost("/api/game/submit", { roomCode, answers });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function finishRound() {
    setBusy(true);
    try {
      await apiPost("/api/game/finish-round", { roomCode });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function scoreRound() {
    setBusy(true);
    try {
      await apiPost("/api/game/score-round", { roomCode });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function nextRound() {
    setBusy(true);
    try {
      const res = await apiPost<{ finished: boolean; gameId: string }>(
        "/api/game/next-round",
        { roomCode },
      );
      if (res.finished) {
        router.push(`/results/${res.gameId}`);
      } else {
        await load();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  if (error && !state) {
    return (
      <SiteShell>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          variant="link"
          className="mt-4 h-auto px-0"
        >
          خانه
        </Button>
      </SiteShell>
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
      <SiteShell>
        <p className="text-center text-muted-foreground">
          در حال اتصال به بازی…
        </p>
      </SiteShell>
    );
  }

  const game = state.game;
  const round = state.round;
  const g = state;
  const phase = g.phase;
  const letter = round.letter;

  function answersForCategory(catKey: string) {
    return g.players.map((p) => {
      const a = p.answers.find((x) => x.categoryKey === catKey);
      return { player: p, answer: a };
    });
  }

  function isDuplicate(catKey: string, normalized: string, isValid: boolean) {
    if (!isValid || !normalized) return false;
    const vals = answersForCategory(catKey)
      .map(({ answer }) => (answer?.isValid ? answer.normalizedValue : ""))
      .filter(Boolean);
    return vals.filter((v) => v === normalized).length > 1;
  }

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

        {isHost ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void finishRound()}
            disabled={busy}
            className="w-full rounded-2xl border-ka-outline-variant"
          >
            پایان دور برای همه
          </Button>
        ) : null}

        <p className="text-center text-xs text-ka-on-surface-variant">
          <Button
            render={<Link href={`/lobby/${roomCode}`} />}
            nativeButton={false}
            variant="link"
            className="h-auto p-0 text-xs font-medium text-ka-on-surface-variant"
          >
            بازگشت به لابی
          </Button>
        </p>
      </main>

      <div className="fixed bottom-0 left-0 z-50 w-full">
        <div className="relative z-20 flex justify-center pb-1">
          <Button
            type="button"
            size="lg"
            onClick={() => void submitAnswers()}
            disabled={busy}
            className="ka-kinetic-shadow-lg h-auto gap-3 rounded-full px-10 py-5 font-heading text-xl font-black shadow-lg"
          >
            <span>استپ!</span>
            <Hand className="size-7" aria-hidden />
          </Button>
        </div>
        <GameBottomNav active="game" />
      </div>
    </>
  );

  if (phase === "playing") {
    return (
      <div className="flex min-h-dvh flex-col bg-ka-surface text-ka-on-surface">
        {playingChrome}
      </div>
    );
  }

  const showScoresInRound = phase !== "review";

  return (
    <div className="flex min-h-dvh flex-col bg-ka-surface pb-36 text-ka-on-surface">
      <header className="sticky top-0 z-40 flex w-full items-center justify-between bg-white/80 px-5 py-4 shadow-[0_12px_32px_rgba(25,28,29,0.06)] backdrop-blur-xl dark:bg-zinc-950/80">
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ka-primary-fixed font-heading text-lg font-black text-ka-on-primary-fixed"
            aria-hidden
          >
            {displayInitial}
          </div>
          <span className="font-heading text-lg font-black tracking-tight text-ka-primary">
            حرفچین
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-ka-secondary-container px-3.5 py-1.5 font-heading text-sm font-semibold text-ka-on-secondary-container">
          <span>{faDigits(myBoardScore)} امتیاز</span>
          <Star className="size-4 fill-amber-600 text-amber-700" aria-hidden />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 space-y-5 px-5 pt-6">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ka-on-surface-variant">
            اتاق{" "}
            <span className="font-mono font-semibold text-foreground" dir="ltr">
              {roomCode}
            </span>
          </p>
          <div className="flex items-center gap-2 rounded-full bg-ka-primary-fixed/35 px-4 py-2 font-heading text-sm font-black text-ka-on-primary-fixed">
            <span>حرف</span>
            <span className="text-lg">{letter}</span>
          </div>
        </div>

        <Button
          render={<Link href={`/lobby/${roomCode}`} />}
          nativeButton={false}
          variant="link"
          className="h-auto px-0 text-sm text-ka-on-surface-variant"
        >
          بازگشت به لابی
        </Button>

        <section className="space-y-4">
          <div className="text-center">
            <h1 className="font-heading text-xl font-black text-ka-on-surface sm:text-2xl">
              نتیجه این دور
            </h1>
            <p className="mt-1 text-sm font-medium text-ka-on-surface-variant">
              دور {faDigits(round.roundNumber)} از {faDigits(game.totalRounds)}
            </p>
          </div>

          <Card className="border-ka-outline-variant/40 ka-kinetic-shadow">
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <div>
                <CardTitle className="font-heading text-base text-ka-primary">
                  جزئیات پاسخ‌ها
                </CardTitle>
                <p className="mt-0.5 text-xs text-ka-on-surface-variant">
                  برای هر ردیف بازیکن را انتخاب کنید
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-0 pt-0">
              <ul className="divide-y divide-ka-outline-variant/35">
                {g.categories.map((c) => {
                  const Icon = categoryIcon(c.key);
                  return (
                    <li
                      key={c.key}
                      className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-start sm:gap-4"
                    >
                      <span className="flex shrink-0 items-center gap-2.5 sm:w-[40%]">
                        <Icon
                          className="size-5 shrink-0 text-ka-primary"
                          aria-hidden
                        />
                        <span className="text-xs font-bold text-ka-on-surface-variant">
                          {c.title}
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <CategoryPlayerTabs
                          players={g.players}
                          categoryKey={c.key}
                          meRoomPlayerId={g.meRoomPlayerId}
                          showScores={showScoresInRound}
                          isDuplicate={isDuplicate}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          {phase === "review" && !isHost ? (
            <p className="text-center text-sm text-ka-on-surface-variant">
              منتظر محاسبه امتیاز توسط میزبان…
            </p>
          ) : null}
          {phase === "between" && !isHost ? (
            <p className="text-center text-sm text-ka-on-surface-variant">
              منتظر شروع دور بعد توسط میزبان…
            </p>
          ) : null}

          <div className="flex flex-col gap-3 pt-2">
            {phase === "review" && isHost ? (
              <Button
                type="button"
                variant="default"
                onClick={() => void scoreRound()}
                disabled={busy}
                className="ka-kinetic-shadow-lg h-auto w-full rounded-full py-5 font-heading text-base font-black"
              >
                محاسبه امتیاز دور
              </Button>
            ) : null}

            {phase === "between" && isHost ? (
              <Button
                type="button"
                variant="default"
                onClick={() => void nextRound()}
                disabled={busy}
                className="ka-kinetic-shadow-lg h-auto w-full rounded-full py-5 font-heading text-base font-black"
              >
                دور بعد
              </Button>
            ) : null}
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 z-50 w-full">
        <GameBottomNav active="game" />
      </div>
    </div>
  );
}
