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
import { Separator } from "@/components/ui/separator";

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
          className="mt-4 h-auto px-0 text-teal-700 dark:text-teal-300"
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
      <h1 className="mb-2 text-2xl font-bold">نتایج نهایی</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        بازی تمام شد. رتبه‌بندی بر اساس مجموع امتیاز دورهاست.
      </p>

      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">جدول نهایی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 pt-0">
          {data.leaderboard.map((row, i) => (
            <div key={row.roomPlayerId}>
              {i > 0 ? <Separator className="my-2" /> : null}
              <div className="flex items-center justify-between py-1 text-sm sm:text-base">
                <span>
                  <span className="ms-2 font-mono text-muted-foreground" dir="ltr">
                    {faDigits(i + 1)}
                  </span>
                  {row.displayName}
                </span>
                <span className="font-mono text-lg" dir="ltr">
                  {faDigits(row.totalScore)}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="outline"
          render={<Link href="/" />}
          nativeButton={false}
          className="h-10 flex-1"
        >
          خانه
        </Button>
        {isHost ? (
          <Button
            type="button"
            disabled={busy}
            onClick={() => void replay()}
            className="h-10 flex-1 bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
          >
            بازی دوباره
          </Button>
        ) : (
          <Button
            render={<Link href={`/lobby/${data.roomCode}`} />}
            nativeButton={false}
            className="h-10 flex-1 bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
          >
            بازگشت به لابی
          </Button>
        )}
      </div>
    </SiteShell>
  );
}
