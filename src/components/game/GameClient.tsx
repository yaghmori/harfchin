"use client";

import { validateAnswerForLetter } from "@/domain/rules/answer-validation";
import { SiteShell } from "@/components/layout/SiteShell";
import { GameBottomNav } from "@/components/game/GameBottomNav";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

  return (
    <SiteShell>
      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-heading text-sm font-bold text-ka-primary">
              حرفچین
            </p>
            <p className="text-xs text-muted-foreground">
              اتاق{" "}
              <span className="font-mono font-semibold" dir="ltr">
                {roomCode}
              </span>{" "}
              · دور {faDigits(round.roundNumber)} از {faDigits(game.totalRounds)}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-ka-primary-fixed/35 px-4 py-2 font-heading text-sm font-black text-ka-on-primary-fixed">
            <span>حرف</span>
            <span className="text-lg">{letter}</span>
          </div>
        </div>
        <Button
          render={<Link href={`/lobby/${roomCode}`} />}
          nativeButton={false}
          variant="link"
          className="h-auto px-0 text-sm"
        >
          بازگشت به لابی
        </Button>
      </div>

      <section className="space-y-6 pb-8">
        <h2 className="font-heading text-lg font-black text-foreground sm:text-xl">
          پاسخ‌ها و امتیاز
        </h2>
        {g.categories.map((c) => {
          const Icon = categoryIcon(c.key);
          return (
            <Card key={c.key} size="sm" className="border-ka-outline-variant/40">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Icon className="size-5 text-ka-primary" aria-hidden />
                <CardTitle className="text-base">{c.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2.5">
                  {answersForCategory(c.key).map(({ player, answer }) => {
                    const dup =
                      answer &&
                      isDuplicate(
                        c.key,
                        answer.normalizedValue,
                        answer.isValid,
                      );
                    return (
                      <li
                        key={player.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-ka-outline-variant/30 bg-ka-surface-container-low/80 px-3 py-2.5 text-sm dark:bg-zinc-900/40"
                      >
                        <span className="font-semibold">
                          {player.displayName}
                        </span>
                        <span className="text-end text-muted-foreground">
                          <span className="text-foreground">
                            {answer?.value || "—"}
                          </span>
                          {answer && !answer.isValid ? (
                            <Badge variant="destructive" className="me-2 mt-1">
                              نامعتبر
                            </Badge>
                          ) : null}
                          {dup ? (
                            <Badge
                              variant="outline"
                              className="me-2 mt-1 border-amber-500/55 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                            >
                              تکراری
                            </Badge>
                          ) : null}
                          {phase !== "review" && answer ? (
                            <span
                              className="ms-1 font-mono font-bold text-ka-primary"
                              dir="ltr"
                            >
                              {faDigits(answer.score)}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          );
        })}

        <Card className="overflow-hidden border-ka-outline-variant/40 py-0">
          <CardHeader className="border-b border-ka-outline-variant/30 bg-ka-primary-fixed/25 py-3 dark:bg-ka-primary-fixed/10">
            <CardTitle className="font-heading text-base text-ka-primary">
              جدول امتیاز
            </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            <ol className="space-y-2">
              {g.leaderboard.map((row, i) => {
                const medal =
                  i === 0
                    ? "🥇"
                    : i === 1
                      ? "🥈"
                      : i === 2
                        ? "🥉"
                        : null;
                const isMe = row.roomPlayerId === g.meRoomPlayerId;
                return (
                  <li
                    key={row.roomPlayerId}
                    className={
                      isMe
                        ? "flex items-center justify-between gap-2 rounded-2xl border-2 border-ka-secondary-container bg-ka-secondary-container/15 px-3 py-2 text-sm shadow-sm"
                        : "flex items-center justify-between gap-2 rounded-2xl border border-ka-outline-variant/30 bg-card px-3 py-2 text-sm shadow-sm"
                    }
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {medal ? (
                        <span className="text-lg" aria-hidden>
                          {medal}
                        </span>
                      ) : (
                        <span
                          className="w-6 text-center font-mono text-xs text-muted-foreground"
                          dir="ltr"
                        >
                          {faDigits(i + 1)}
                        </span>
                      )}
                      <span className="truncate font-semibold">
                        {row.displayName}
                        {isMe ? (
                          <span className="me-1 text-xs text-ka-primary">
                            (شما)
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span
                      className="shrink-0 font-mono text-base font-bold text-ka-primary"
                      dir="ltr"
                    >
                      {faDigits(row.totalScore)}
                    </span>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        {phase === "review" && isHost ? (
          <Button
            type="button"
            variant="default"
            onClick={() => void scoreRound()}
            disabled={busy}
            className="w-full"
          >
            محاسبه امتیاز دور
          </Button>
        ) : null}

        {phase === "between" && isHost ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => void nextRound()}
            disabled={busy}
            className="w-full"
          >
            دور بعد / پایان بازی
          </Button>
        ) : null}

        {phase === "finished" ? (
          <Button
            render={<Link href={`/results/${game.id}`} />}
            nativeButton={false}
            variant="default"
            className="w-full gap-2"
          >
            <Sparkles className="size-4" aria-hidden />
            صفحه نتایج نهایی
          </Button>
        ) : null}
      </section>
    </SiteShell>
  );
}
