"use client";

import { SiteShell } from "@/components/layout/SiteShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiGet, apiPost } from "@/features/api/client";
import { POLL_INTERVAL_MS } from "@/lib/constants";
import { faDigits } from "@/lib/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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

function TimerGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle
        cx="12"
        cy="14"
        r="7.5"
        stroke="currentColor"
        strokeWidth="1.75"
        className="text-[var(--game-blue)]"
      />
      <path
        d="M12 10v3.2l2.2 1.4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        className="text-[var(--game-blue-dark)]"
      />
      <path
        d="M9 4h6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        className="text-[var(--game-blue)]"
      />
      <path
        d="M12 4V2.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        className="text-[var(--game-blue)]"
      />
    </svg>
  );
}

function RoundGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="var(--game-gold)"
        stroke="var(--game-gold-deep)"
        strokeWidth="1.5"
      />
      <path
        d="M12 8.2l1.2 2.5 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4L12 8.2z"
        fill="var(--game-gold-deep)"
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

  const timerUrgent = phase === "playing" && secondsLeft > 0 && secondsLeft <= 12;

  const hud = (
    <div className="flex items-stretch justify-between gap-2 sm:gap-3">
      <div className="flex min-w-0 items-center gap-2 rounded-full border border-border/50 bg-card py-1.5 ps-2 pe-3 shadow-[var(--game-shadow-sm)]">
        <RoundGlyph className="size-9 shrink-0" />
        <div className="min-w-0 leading-tight">
          <p className="text-[0.65rem] font-semibold text-muted-foreground">
            دور
          </p>
          <p className="text-sm font-black tabular-nums text-[var(--game-gold-deep)] dark:text-[var(--game-gold)]">
            {faDigits(round.roundNumber)}
            <span className="text-muted-foreground">/</span>
            {faDigits(game.totalRounds)}
          </p>
        </div>
      </div>

      <div
        className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--game-blue)]/15 bg-[var(--game-timer-bg)] px-3 py-2 shadow-[inset_0_2px_6px_rgb(0_0_0/0.06)] sm:px-4 dark:shadow-[inset_0_2px_8px_rgb(0_0_0/0.25)]"
        dir="ltr"
      >
        <TimerGlyph className="size-8 shrink-0 text-[var(--game-blue)]" />
        <span
          className={`text-3xl font-black tabular-nums tracking-tight text-[var(--game-blue-dark)] dark:text-[var(--game-blue)] sm:text-4xl ${timerUrgent ? "animate-game-timer" : ""}`}
        >
          {faDigits(secondsLeft)}
        </span>
      </div>

      <div
        className="flex size-[3.25rem] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[var(--game-green)] to-[var(--game-green-dark)] text-2xl font-black text-white shadow-[0_4px_0_0_rgb(34_197_94/0.28)] sm:size-14 sm:text-3xl dark:shadow-[0_4px_0_0_rgb(0_0_0/0.35)]"
        title="حرف دور"
      >
        {letter}
      </div>
    </div>
  );

  return (
    <SiteShell>
      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-4 space-y-3">
        {hud}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">
            اتاق{" "}
            <span className="font-mono font-bold text-foreground" dir="ltr">
              {roomCode}
            </span>
          </p>
          <Button
            render={<Link href={`/lobby/${roomCode}`} />}
            nativeButton={false}
            variant="link"
            className="h-auto px-2 py-1 text-xs sm:text-sm"
          >
            بازگشت به لابی
          </Button>
        </div>
      </div>

      {phase === "playing" ? (
        <section className="space-y-4 pb-10">
          <div className="grid gap-3">
            {g.categories.map((c) => (
              <Card
                key={c.key}
                className="gap-3 py-3 shadow-[var(--game-shadow-sm)]"
              >
                <CardHeader className="space-y-1 pb-0">
                  <CardTitle className="text-base sm:text-lg">{c.title}</CardTitle>
                  <p className="text-xs font-medium text-muted-foreground">
                    (با حرف{" "}
                    <span className="font-bold text-[var(--game-green-dark)] dark:text-[var(--game-green)]">
                      {letter}
                    </span>
                    )
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <Input
                    id={`cat-${c.key}`}
                    value={form[c.key] ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [c.key]: e.target.value }))
                    }
                    dir="auto"
                    autoComplete="off"
                    placeholder="پاسخ خود را بنویسید…"
                    className="h-12 text-base"
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="button"
              variant="game"
              onClick={() => void submitAnswers()}
              disabled={busy}
              className="w-full"
            >
              ذخیره پاسخ‌ها
            </Button>
            {isHost ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void finishRound()}
                disabled={busy}
                className="w-full"
              >
                پایان دور
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {(phase === "review" || phase === "between" || phase === "finished") && (
        <section className="space-y-6 pb-8">
          <h2 className="text-lg font-black text-foreground sm:text-xl">
            پاسخ‌ها و امتیاز
          </h2>
          {g.categories.map((c) => (
            <Card key={c.key} className="gap-3 py-3">
              <CardHeader className="pb-0">
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
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--game-input)]/50 px-3 py-2.5 text-sm dark:bg-[var(--game-input)]/30"
                      >
                        <span className="font-semibold">{player.displayName}</span>
                        <span className="text-end text-muted-foreground">
                          <span className="text-foreground">{answer?.value || "—"}</span>
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
                              className="ms-1 font-mono font-bold text-[var(--game-blue-dark)] dark:text-[var(--game-blue)]"
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
          ))}

          <Card className="overflow-hidden py-0">
            <CardHeader className="border-b border-border/40 bg-[var(--game-timer-bg)]/60 py-3 dark:bg-[var(--game-timer-bg)]/25">
              <CardTitle className="text-base">جدول امتیاز</CardTitle>
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
                  return (
                    <li
                      key={row.roomPlayerId}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border/40 bg-card px-3 py-2 text-sm shadow-sm"
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
                        </span>
                      </span>
                      <span
                        className="shrink-0 font-mono text-base font-bold text-[var(--game-blue-dark)] dark:text-[var(--game-blue)]"
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
              variant="game"
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
              variant="gameMuted"
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
              variant="game"
              className="w-full"
            >
              صفحه نتایج نهایی
            </Button>
          ) : null}
        </section>
      )}
    </SiteShell>
  );
}
