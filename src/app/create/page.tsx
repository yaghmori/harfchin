"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { apiPost } from "@/features/api/client";

export default function CreateRoomPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [rounds, setRounds] = useState(5);
  const [seconds, setSeconds] = useState(120);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPost<{ roomCode: string }>("/api/room/create", {
        displayName,
        draftTotalRounds: rounds,
        draftRoundTimeSec: seconds,
        maxPlayers,
      });
      router.push(`/lobby/${data.roomCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <h1 className="mb-6 text-2xl font-bold">ساخت اتاق</h1>
      <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
        <div>
          <label htmlFor="dn" className="mb-1 block text-sm font-medium">
            نام نمایشی
          </label>
          <input
            id="dn"
            name="displayName"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-[var(--card)] px-3 py-2 dark:border-slate-600"
            autoComplete="nickname"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="r" className="mb-1 block text-sm font-medium">
              تعداد دور
            </label>
            <input
              id="r"
              type="number"
              min={1}
              max={20}
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-[var(--card)] px-3 py-2 dark:border-slate-600"
            />
          </div>
          <div>
            <label htmlFor="t" className="mb-1 block text-sm font-medium">
              زمان دور (ثانیه)
            </label>
            <input
              id="t"
              type="number"
              min={30}
              max={600}
              value={seconds}
              onChange={(e) => setSeconds(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-[var(--card)] px-3 py-2 dark:border-slate-600"
            />
          </div>
        </div>
        <div>
          <label htmlFor="m" className="mb-1 block text-sm font-medium">
            حداکثر بازیکن
          </label>
          <input
            id="m"
            type="number"
            min={2}
            max={16}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 bg-[var(--card)] px-3 py-2 dark:border-slate-600"
          />
        </div>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-teal-600 px-4 py-3 font-medium text-white disabled:opacity-60"
        >
          {loading ? "در حال ساخت…" : "ساخت اتاق"}
        </button>
      </form>
    </SiteShell>
  );
}
