"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { faDigits } from "@/lib/format";
import { apiGet, apiPost } from "@/features/api/client";
import { SiteShell } from "@/components/layout/SiteShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  if (!data) {
    return (
      <SiteShell>
        <p className="text-muted-foreground">در حال بارگذاری نتایج…</p>
      </SiteShell>
    );
  }

  const isHost = data.hostUserId === data.meUserId;

  return (
    <SiteShell>
      <h1 className="mb-2 text-2xl font-black tracking-tight sm:text-3xl">
        نتایج نهایی
      </h1>
      <p className="mb-6 text-sm font-medium text-muted-foreground">
        بازی تمام شد. رتبه‌بندی بر اساس مجموع امتیاز دورهاست.
      </p>

      <Card className="mb-8 overflow-hidden py-0">
        <CardHeader className="border-b border-border/40 bg-[var(--game-timer-bg)]/70 py-3 dark:bg-[var(--game-timer-bg)]/25">
          <CardTitle className="text-base font-bold">جدول نهایی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 py-4">
          {data.leaderboard.map((row, i) => {
            const medal =
              i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <div
                key={row.roomPlayerId}
                className="flex items-center justify-between gap-2 rounded-xl border border-border/40 bg-[var(--game-input)]/35 px-3 py-2.5 dark:bg-[var(--game-input)]/20"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold sm:text-base">
                  {medal ? (
                    <span className="text-xl" aria-hidden>
                      {medal}
                    </span>
                  ) : (
                    <span
                      className="w-7 text-center font-mono text-xs text-muted-foreground"
                      dir="ltr"
                    >
                      {faDigits(i + 1)}
                    </span>
                  )}
                  <span className="truncate">{row.displayName}</span>
                </span>
                <span
                  className="shrink-0 font-mono text-lg font-bold text-[var(--game-blue-dark)] dark:text-[var(--game-blue)]"
                  dir="ltr"
                >
                  {faDigits(row.totalScore)}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="secondary"
          render={<Link href="/" />}
          nativeButton={false}
          className="flex-1"
        >
          خانه
        </Button>
        {isHost ? (
          <Button
            type="button"
            disabled={busy}
            variant="game"
            onClick={() => void replay()}
            className="flex-1"
          >
            بازی دوباره
          </Button>
        ) : (
          <Button
            render={<Link href={`/lobby/${data.roomCode}`} />}
            nativeButton={false}
            variant="game"
            className="flex-1"
          >
            بازگشت به لابی
          </Button>
        )}
      </div>
    </SiteShell>
  );
}
