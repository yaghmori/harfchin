"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { POLL_INTERVAL_MS } from "@/lib/constants";
import { faDigits } from "@/lib/format";
import { apiGet, apiPost } from "@/features/api/client";
import { SiteShell } from "@/components/layout/SiteShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  leaderboard: { roomPlayerId: string; displayName: string; totalScore: number }[];
  categories: { key: string; title: string }[];
};

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

  const secondsLeft = useMemo(() => {
    if (!state?.round) return 0;
    const end = new Date(state.round.endsAt).getTime();
    const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    return left;
  }, [state?.round, tick]);

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
          className="mt-4 h-auto px-0 text-teal-700 dark:text-teal-300"
        >
          خانه
        </Button>
      </SiteShell>
    );
  }

  if (!state?.game || !state.round) {
    return (
      <SiteShell>
        <p className="text-muted-foreground">در حال اتصال به بازی…</p>
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
      .map(({ answer }) =>
        answer?.isValid ? answer.normalizedValue : "",
      )
      .filter(Boolean);
    return vals.filter((v) => v === normalized).length > 1;
  }

  return (
    <SiteShell>
      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">دور {faDigits(round.roundNumber)}</h1>
          <p className="text-muted-foreground">
            از {faDigits(game.totalRounds)} دور · حرف:{" "}
            <span className="text-3xl font-bold text-teal-600 dark:text-teal-300">
              {letter}
            </span>
          </p>
        </div>
        <Button
          render={<Link href={`/lobby/${roomCode}`} />}
          nativeButton={false}
          variant="link"
          className="h-auto px-0 text-sm text-teal-700 dark:text-teal-300"
        >
          بازگشت به لابی
        </Button>
      </div>

      {phase === "playing" ? (
        <section className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                زمان باقی‌مانده
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-4xl font-bold tabular-nums" dir="ltr">
                {faDigits(secondsLeft)}
              </p>
            </CardContent>
          </Card>
          <div className="grid gap-3">
            {g.categories.map((c) => (
              <div key={c.key} className="space-y-2">
                <Label htmlFor={`cat-${c.key}`}>{c.title}</Label>
                <Input
                  id={`cat-${c.key}`}
                  value={form[c.key] ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [c.key]: e.target.value }))
                  }
                  className="h-10"
                  dir="auto"
                  autoComplete="off"
                />
              </div>
            ))}
          </div>
          <Button
            type="button"
            onClick={() => void submitAnswers()}
            disabled={busy}
            className="h-10 w-full bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
          >
            ذخیره پاسخ‌ها
          </Button>
          {isHost ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void finishRound()}
              disabled={busy}
              className="h-10 w-full"
            >
              پایان دور
            </Button>
          ) : null}
        </section>
      ) : null}

      {(phase === "review" || phase === "between" || phase === "finished") && (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold">پاسخ‌ها و امتیاز</h2>
          {g.categories.map((c) => (
            <Card key={c.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{c.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
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
                        className="flex flex-wrap items-center justify-between gap-2 text-sm"
                      >
                        <span>{player.displayName}</span>
                        <span className="text-muted-foreground">
                          {answer?.value || "—"}
                          {answer && !answer.isValid ? (
                            <Badge variant="destructive" className="me-2">
                              نامعتبر
                            </Badge>
                          ) : null}
                          {dup ? (
                            <Badge
                              variant="outline"
                              className="me-2 border-amber-500/50 text-amber-700 dark:text-amber-400"
                            >
                              تکراری
                            </Badge>
                          ) : null}
                          {phase !== "review" && answer ? (
                            <span className="me-2 font-mono" dir="ltr">
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">جدول امتیاز</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ol className="space-y-1">
                {g.leaderboard.map((row, i) => (
                  <li
                    key={row.roomPlayerId}
                    className="flex justify-between text-sm"
                  >
                    <span>
                      {faDigits(i + 1)}. {row.displayName}
                    </span>
                    <span className="font-mono" dir="ltr">
                      {faDigits(row.totalScore)}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {phase === "review" && isHost ? (
            <Button
              type="button"
              onClick={() => void scoreRound()}
              disabled={busy}
              className="h-10 w-full bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
            >
              محاسبه امتیاز دور
            </Button>
          ) : null}

          {phase === "between" && isHost ? (
            <Button
              type="button"
              onClick={() => void nextRound()}
              disabled={busy}
              className="h-10 w-full"
            >
              دور بعد / پایان بازی
            </Button>
          ) : null}

          {phase === "finished" ? (
            <Button
              render={<Link href={`/results/${game.id}`} />}
              nativeButton={false}
              className="h-10 w-full bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
            >
              صفحه نتایج نهایی
            </Button>
          ) : null}
        </section>
      )}
    </SiteShell>
  );
}
