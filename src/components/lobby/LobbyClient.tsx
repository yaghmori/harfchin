"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Player = {
  id: string;
  userId: string;
  displayName: string;
  isHost: boolean;
  isReady: boolean;
};

type RoomState = {
  roomCode: string;
  status: string;
  hostId: string;
  maxPlayers: number;
  draftTotalRounds: number;
  draftRoundTimeSec: number;
  activeGameId: string | null;
  lastFinishedGameId: string | null;
  players: Player[];
  minPlayersToStart: number;
  meUserId: string;
};

export function LobbyClient({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draftRounds, setDraftRounds] = useState(5);
  const [draftSec, setDraftSec] = useState(120);
  const [draftMax, setDraftMax] = useState(8);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<RoomState>(
        `/api/room/state?code=${encodeURIComponent(roomCode)}`,
      );
      setState(data);
      setDraftRounds(data.draftTotalRounds);
      setDraftSec(data.draftRoundTimeSec);
      setDraftMax(data.maxPlayers);
      setError(null);
      if (data.status === "playing" && data.activeGameId) {
        router.push(`/game/${data.roomCode}`);
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

  const me = state?.players.find((p) => p.userId === state.meUserId);
  const isHost = state?.hostId === state?.meUserId;

  async function toggleReady() {
    if (!state || !me) return;
    setBusy(true);
    try {
      await apiPost("/api/room/ready", {
        roomCode: state.roomCode,
        isReady: !me.isReady,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!state || !isHost) return;
    setBusy(true);
    try {
      await apiPost("/api/room/settings", {
        roomCode: state.roomCode,
        draftTotalRounds: draftRounds,
        draftRoundTimeSec: draftSec,
        maxPlayers: draftMax,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function startGame() {
    if (!state) return;
    setBusy(true);
    try {
      await apiPost("/api/game/start", { roomCode: state.roomCode });
      router.push(`/game/${state.roomCode}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function replayLobby() {
    if (!state) return;
    setBusy(true);
    try {
      await apiPost("/api/room/replay", { roomCode: state.roomCode });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    if (!state) return;
    setBusy(true);
    try {
      await apiPost("/api/room/leave", { roomCode: state.roomCode });
      router.push("/");
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
          بازگشت
        </Button>
      </SiteShell>
    );
  }

  if (!state) {
    return (
      <SiteShell>
        <p className="text-muted-foreground">در حال بارگذاری لابی…</p>
      </SiteShell>
    );
  }

  const allReady = state.players.length > 0 && state.players.every((p) => p.isReady);
  const canStart =
    isHost &&
    state.players.length >= state.minPlayersToStart &&
    allReady &&
    state.status === "waiting";

  return (
    <SiteShell>
      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">لابی</h1>
          <p className="text-muted-foreground">
            کد اتاق:{" "}
            <span className="font-mono text-lg font-semibold text-foreground" dir="ltr">
              {state.roomCode}
            </span>
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void leave()}
          disabled={busy}
          className="h-9"
        >
          ترک اتاق
        </Button>
      </div>

      {isHost && state.status === "waiting" ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">تنظیمات بازی (میزبان)</CardTitle>
          </CardHeader>
          <CardContent>
            <form id="lobby-settings" onSubmit={saveSettings} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="draftRounds">تعداد دور</Label>
                  <Input
                    id="draftRounds"
                    type="number"
                    min={1}
                    max={20}
                    value={draftRounds}
                    onChange={(e) => setDraftRounds(Number(e.target.value))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="draftSec">زمان دور (ثانیه)</Label>
                  <Input
                    id="draftSec"
                    type="number"
                    min={30}
                    max={600}
                    value={draftSec}
                    onChange={(e) => setDraftSec(Number(e.target.value))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="draftMax">حداکثر بازیکن</Label>
                  <Input
                    id="draftMax"
                    type="number"
                    min={2}
                    max={16}
                    value={draftMax}
                    onChange={(e) => setDraftMax(Number(e.target.value))}
                    className="h-9"
                  />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="justify-start border-t-0 pt-0">
            <Button
              type="submit"
              form="lobby-settings"
              disabled={busy}
              size="sm"
            >
              ذخیره تنظیمات
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 font-semibold">بازیکنان</h2>
        <ul className="space-y-2">
          {state.players.map((p) => (
            <li key={p.id}>
              <Card className="py-3">
                <CardContent className="flex items-center justify-between px-3 py-0">
                  <span className="flex flex-wrap items-center gap-2">
                    {p.displayName}
                    {p.isHost ? (
                      <Badge
                        variant="secondary"
                        className="text-xs text-teal-700 dark:text-teal-300"
                      >
                        میزبان
                      </Badge>
                    ) : null}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {p.isReady ? "آماده" : "در انتظار"}
                  </span>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {state.status === "finished" && state.lastFinishedGameId ? (
        <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40">
          <AlertDescription className="flex flex-col gap-3 text-foreground">
            <span className="font-medium">این بازی به پایان رسیده است.</span>
            <Button
              render={
                <Link href={`/results/${state.lastFinishedGameId}`} />
              }
              nativeButton={false}
              className="h-10 w-full bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
            >
              مشاهده نتایج
            </Button>
            {isHost ? (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void replayLobby()}
                className="h-10 w-full"
              >
                بازی دوباره (بازنشانی لابی)
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          onClick={() => void toggleReady()}
          disabled={busy || !me || state.status === "finished"}
          className="h-10 flex-1 bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
        >
          {me?.isReady ? "لغو آمادگی" : "من آماده‌ام"}
        </Button>
        {isHost ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void startGame()}
            disabled={!canStart || busy || state.status === "finished"}
            className="h-10 flex-1 border-2 border-teal-600 text-teal-700 dark:border-teal-500 dark:text-teal-300"
          >
            شروع بازی
          </Button>
        ) : null}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        حداقل {faDigits(state.minPlayersToStart)} بازیکن و آمادگی همه برای شروع لازم است.
      </p>
    </SiteShell>
  );
}
