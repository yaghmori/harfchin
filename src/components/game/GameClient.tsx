"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { POLL_INTERVAL_MS } from "@/lib/constants";
import { faDigits } from "@/lib/format";
import { apiGet, apiPost } from "@/features/api/client";
import { SiteShell } from "@/components/layout/SiteShell";

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
        <p className="text-red-600">{error}</p>
        <Link href="/" className="mt-4 text-teal-700 underline">
          خانه
        </Link>
      </SiteShell>
    );
  }

  if (!state?.game || !state.round) {
    return (
      <SiteShell>
        <p className="text-[var(--muted)]">در حال اتصال به بازی…</p>
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
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">دور {faDigits(round.roundNumber)}</h1>
          <p className="text-[var(--muted)]">
            از {faDigits(game.totalRounds)} دور · حرف:{" "}
            <span className="text-3xl font-bold text-teal-600 dark:text-teal-300">
              {letter}
            </span>
          </p>
        </div>
        <Link
          href={`/lobby/${roomCode}`}
          className="text-sm text-teal-700 underline dark:text-teal-300"
        >
          بازگشت به لابی
        </Link>
      </div>

      {phase === "playing" ? (
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-[var(--card)] p-4 dark:border-slate-600">
            <p className="text-sm text-[var(--muted)]">زمان باقی‌مانده</p>
            <p className="text-4xl font-bold tabular-nums" dir="ltr">
              {faDigits(secondsLeft)}
            </p>
          </div>
          <div className="grid gap-3">
            {g.categories.map((c) => (
              <label key={c.key} className="block text-sm">
                <span className="mb-1 block font-medium">{c.title}</span>
                <input
                  value={form[c.key] ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [c.key]: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-[var(--card)] px-3 py-2 dark:border-slate-600"
                  dir="auto"
                  autoComplete="off"
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void submitAnswers()}
            disabled={busy}
            className="w-full rounded-xl bg-teal-600 px-4 py-3 font-medium text-white"
          >
            ذخیره پاسخ‌ها
          </button>
          {isHost ? (
            <button
              type="button"
              onClick={() => void finishRound()}
              disabled={busy}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 font-medium dark:border-slate-500"
            >
              پایان دور
            </button>
          ) : null}
        </section>
      ) : null}

      {(phase === "review" || phase === "between" || phase === "finished") && (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold">پاسخ‌ها و امتیاز</h2>
          {g.categories.map((c) => (
            <div
              key={c.key}
              className="rounded-2xl border border-slate-200 bg-[var(--card)] p-4 dark:border-slate-600"
            >
              <h3 className="mb-2 font-medium">{c.title}</h3>
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
                      <span className="text-[var(--muted)]">
                        {answer?.value || "—"}
                        {answer && !answer.isValid ? (
                          <span className="mr-2 text-red-500">نامعتبر</span>
                        ) : null}
                        {dup ? (
                          <span className="mr-2 text-amber-600">تکراری</span>
                        ) : null}
                        {phase !== "review" && answer ? (
                          <span className="mr-2 font-mono" dir="ltr">
                            {faDigits(answer.score)}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="rounded-2xl border border-slate-200 bg-[var(--card)] p-4 dark:border-slate-600">
            <h3 className="mb-2 font-medium">جدول امتیاز</h3>
            <ol className="space-y-1">
              {g.leaderboard.map((row, i) => (
                <li key={row.roomPlayerId} className="flex justify-between text-sm">
                  <span>
                    {faDigits(i + 1)}. {row.displayName}
                  </span>
                  <span className="font-mono" dir="ltr">
                    {faDigits(row.totalScore)}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {phase === "review" && isHost ? (
            <button
              type="button"
              onClick={() => void scoreRound()}
              disabled={busy}
              className="w-full rounded-xl bg-teal-600 px-4 py-3 font-medium text-white"
            >
              محاسبه امتیاز دور
            </button>
          ) : null}

          {phase === "between" && isHost ? (
            <button
              type="button"
              onClick={() => void nextRound()}
              disabled={busy}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white dark:bg-slate-100 dark:text-slate-900"
            >
              دور بعد / پایان بازی
            </button>
          ) : null}

          {phase === "finished" ? (
            <Link
              href={`/results/${game.id}`}
              className="block w-full rounded-xl bg-teal-600 py-3 text-center font-medium text-white"
            >
              صفحه نتایج نهایی
            </Link>
          ) : null}
        </section>
      )}
    </SiteShell>
  );
}
