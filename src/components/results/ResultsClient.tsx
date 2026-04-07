"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { faDigits } from "@/lib/format";
import { apiGet, apiPost } from "@/features/api/client";
import { SiteShell } from "@/components/layout/SiteShell";

type ResultsPayload = {
  meUserId: string;
  hostUserId: string;
  roomCode: string;
  game: {
    id: string;
    status: string;
    currentRound: number;
    totalRounds: number;
    roundTimeSec: number;
  };
  round: {
    id: string;
    roundNumber: number;
    letter: string;
    status: string;
  } | null;
  leaderboard: { roomPlayerId: string; displayName: string; totalScore: number }[];
  categories: { key: string; title: string }[];
};

export function ResultsClient({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [data, setData] = useState<ResultsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiGet<ResultsPayload>(
        `/api/game/state?gameId=${encodeURIComponent(gameId)}`,
      );
      setData(res);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    }
  }, [gameId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function replay() {
    if (!data) return;
    if (data.hostUserId !== data.meUserId) return;
    setBusy(true);
    try {
      await apiPost("/api/room/replay", { roomCode: data.roomCode });
      router.push(`/lobby/${data.roomCode}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return (
      <SiteShell>
        <p className="text-red-600">{error}</p>
        <Link href="/" className="mt-4 text-teal-700 underline">
          خانه
        </Link>
      </SiteShell>
    );
  }

  if (!data) {
    return (
      <SiteShell>
        <p className="text-[var(--muted)]">در حال بارگذاری نتایج…</p>
      </SiteShell>
    );
  }

  const isHost = data.hostUserId === data.meUserId;

  return (
    <SiteShell>
      <h1 className="mb-2 text-2xl font-bold">نتایج نهایی</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        بازی تمام شد. رتبه‌بندی بر اساس مجموع امتیاز دورهاست.
      </p>

      <ol className="mb-8 space-y-2 rounded-2xl border border-slate-200 bg-[var(--card)] p-4 dark:border-slate-600">
        {data.leaderboard.map((row, i) => (
          <li
            key={row.roomPlayerId}
            className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0 dark:border-slate-700"
          >
            <span>
              <span className="ml-2 font-mono text-[var(--muted)]" dir="ltr">
                {faDigits(i + 1)}
              </span>
              {row.displayName}
            </span>
            <span className="font-mono text-lg" dir="ltr">
              {faDigits(row.totalScore)}
            </span>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="flex-1 rounded-xl border border-slate-200 py-3 text-center font-medium dark:border-slate-600"
        >
          خانه
        </Link>
        {isHost ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void replay()}
            className="flex-1 rounded-xl bg-teal-600 py-3 font-medium text-white disabled:opacity-50"
          >
            بازی دوباره
          </button>
        ) : (
          <Link
            href={`/lobby/${data.roomCode}`}
            className="flex-1 rounded-xl bg-teal-600 py-3 text-center font-medium text-white"
          >
            بازگشت به لابی
          </Link>
        )}
      </div>
    </SiteShell>
  );
}
