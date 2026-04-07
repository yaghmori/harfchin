"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { apiPost } from "@/features/api/client";

export default function JoinRoomPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPost<{ roomCode: string }>("/api/room/join", {
        roomCode: roomCode.trim(),
        displayName,
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
      <h1 className="mb-6 text-2xl font-bold">ورود به اتاق</h1>
      <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
        <div>
          <label htmlFor="code" className="mb-1 block text-sm font-medium">
            کد اتاق
          </label>
          <input
            id="code"
            name="roomCode"
            required
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className="w-full rounded-xl border border-slate-200 bg-[var(--card)] px-3 py-2 font-mono tracking-widest dark:border-slate-600"
            dir="ltr"
            autoComplete="off"
          />
        </div>
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
          {loading ? "در حال ورود…" : "ورود"}
        </button>
      </form>
    </SiteShell>
  );
}
