"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { POLL_INTERVAL_MS } from "@/lib/constants";
import { faDigits } from "@/lib/format";
import { apiGet, apiPost } from "@/features/api/client";
import { SiteShell } from "@/components/layout/SiteShell";

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
        <p className="text-red-600">{error}</p>
        <Link href="/" className="mt-4 text-teal-700 underline">
          بازگشت
        </Link>
      </SiteShell>
    );
  }

  if (!state) {
    return (
      <SiteShell>
        <p className="text-[var(--muted)]">در حال بارگذاری لابی…</p>
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
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">لابی</h1>
          <p className="text-[var(--muted)]">
            کد اتاق:{" "}
            <span className="font-mono text-lg font-semibold text-foreground" dir="ltr">
              {state.roomCode}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => void leave()}
          disabled={busy}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-600"
        >
          ترک اتاق
        </button>
      </div>

      {isHost && state.status === "waiting" ? (
        <form
          onSubmit={saveSettings}
          className="mb-8 rounded-2xl border border-slate-200 bg-[var(--card)] p-4 dark:border-slate-600"
        >
          <h2 className="mb-3 font-semibold">تنظیمات بازی (میزبان)</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">
              تعداد دور
              <input
                type="number"
                min={1}
                max={20}
                value={draftRounds}
                onChange={(e) => setDraftRounds(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-600"
              />
            </label>
            <label className="text-sm">
              زمان دور (ثانیه)
              <input
                type="number"
                min={30}
                max={600}
                value={draftSec}
                onChange={(e) => setDraftSec(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-600"
              />
            </label>
            <label className="text-sm">
              حداکثر بازیکن
              <input
                type="number"
                min={2}
                max={16}
                value={draftMax}
                onChange={(e) => setDraftMax(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-600"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-3 rounded-lg bg-slate-800 px-3 py-2 text-sm text-white dark:bg-slate-200 dark:text-slate-900"
          >
            ذخیره تنظیمات
          </button>
        </form>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 font-semibold">بازیکنان</h2>
        <ul className="space-y-2">
          {state.players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-[var(--card)] px-3 py-2 dark:border-slate-600"
            >
              <span>
                {p.displayName}
                {p.isHost ? (
                  <span className="mr-2 text-xs text-teal-600">میزبان</span>
                ) : null}
              </span>
              <span className="text-sm text-[var(--muted)]">
                {p.isReady ? "آماده" : "در انتظار"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {state.status === "finished" && state.lastFinishedGameId ? (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
          <p className="font-medium">این بازی به پایان رسیده است.</p>
          <Link
            href={`/results/${state.lastFinishedGameId}`}
            className="rounded-xl bg-teal-600 py-3 text-center font-medium text-white"
          >
            مشاهده نتایج
          </Link>
          {isHost ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void replayLobby()}
              className="rounded-xl border border-slate-300 py-3 font-medium dark:border-slate-500"
            >
              بازی دوباره (بازنشانی لابی)
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => void toggleReady()}
          disabled={busy || !me || state.status === "finished"}
          className="flex-1 rounded-xl bg-teal-600 px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {me?.isReady ? "لغو آمادگی" : "من آماده‌ام"}
        </button>
        {isHost ? (
          <button
            type="button"
            onClick={() => void startGame()}
            disabled={!canStart || busy || state.status === "finished"}
            className="flex-1 rounded-xl border-2 border-teal-600 px-4 py-3 font-medium text-teal-700 disabled:opacity-50 dark:text-teal-300"
          >
            شروع بازی
          </button>
        ) : null}
      </div>

      <p className="mt-6 text-sm text-[var(--muted)]">
        حداقل {faDigits(state.minPlayersToStart)} بازیکن و آمادگی همه برای شروع لازم است.
      </p>
    </SiteShell>
  );
}
