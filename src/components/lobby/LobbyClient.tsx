"use client";

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
import { apiGet, apiPost } from "@/features/api/client";
import { useRoomSse } from "@/features/realtime/useRoomSse";
import { faDigits } from "@/lib/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
  }, [load]);

  useRoomSse(roomCode, load);

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
          className="mt-4 h-auto px-0"
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

  const allReady =
    state.players.length > 0 && state.players.every((p) => p.isReady);
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

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            لابی
          </h1>
          <p className="text-sm text-muted-foreground">
            کد اتاق:{" "}
            <span
              className="rounded-lg bg-[var(--game-input)] px-2 py-0.5 font-mono text-base font-bold text-[var(--game-blue-dark)] dark:text-[var(--game-blue)]"
              dir="ltr"
            >
              {state.roomCode}
            </span>
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => void leave()}
          disabled={busy}
          className="shrink-0"
        >
          ترک اتاق
        </Button>
      </div>

      {isHost && state.status === "waiting" ? (
        <Card className="mb-8 border-[var(--game-blue)]/20">
          <CardHeader className="border-b border-border/40 bg-[var(--game-timer-bg)]/50 pb-3 dark:bg-[var(--game-timer-bg)]/20">
            <CardTitle className="text-base">تنظیمات بازی (میزبان)</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              id="lobby-settings"
              onSubmit={saveSettings}
              className="space-y-4"
            >
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
        <h2 className="mb-3 text-lg font-black">بازیکنان</h2>
        <ul className="space-y-2.5">
          {state.players.map((p) => (
            <li key={p.id}>
              <Card className="py-0">
                <CardContent className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="truncate font-semibold">
                      {p.displayName}
                    </span>
                    {p.isHost ? (
                      <Badge
                        variant="secondary"
                        className="border-0 bg-[var(--game-mint-bg)] text-[var(--game-mint-text)]"
                      >
                        میزبان
                      </Badge>
                    ) : null}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${p.isReady ? "bg-[var(--game-green)]/25 text-[var(--game-green-dark)] dark:text-[var(--game-green)]" : "bg-muted text-muted-foreground"}`}
                  >
                    {p.isReady ? "آماده ✓" : "در انتظار"}
                  </span>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {state.status === "finished" && state.lastFinishedGameId ? (
        <Alert className="mb-6 border-amber-400/35 bg-gradient-to-br from-amber-50 to-orange-50/80 dark:from-amber-950/40 dark:to-orange-950/20">
          <AlertDescription className="flex flex-col gap-3 text-foreground">
            <span className="font-bold">این بازی به پایان رسیده است.</span>
            <Button
              render={<Link href={`/results/${state.lastFinishedGameId}`} />}
              nativeButton={false}
              variant="game"
              className="w-full"
            >
              مشاهده نتایج
            </Button>
            {isHost ? (
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => void replayLobby()}
                className="w-full"
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
          variant="gameMint"
          onClick={() => void toggleReady()}
          disabled={busy || !me || state.status === "finished"}
          className="flex-1"
        >
          {me?.isReady ? "لغو آمادگی" : "من آماده‌ام ✓"}
        </Button>
        {isHost ? (
          <Button
            type="button"
            variant="gameWarm"
            onClick={() => void startGame()}
            disabled={!canStart || busy || state.status === "finished"}
            className="flex-1"
          >
            🎮 شروع بازی
          </Button>
        ) : null}
      </div>

      <p className="mt-6 rounded-xl bg-[var(--game-input)]/50 px-3 py-2 text-center text-xs font-medium text-muted-foreground dark:bg-[var(--game-input)]/25 sm:text-sm">
        حداقل {faDigits(state.minPlayersToStart)} بازیکن و آمادگی همه برای شروع
        لازم است.
      </p>
    </SiteShell>
  );
}
