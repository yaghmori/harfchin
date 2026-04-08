"use client";

import { useRouter } from "next/navigation";
import {
  ChevronDown,
  CirclePlus,
  Globe,
  ListOrdered,
  Lock,
  Timer,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { apiPost } from "@/features/api/client";
import { useSyncErrorToToast } from "@/hooks/use-sync-error-toast";
import { faDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

const ROUND_OPTIONS = [
  { value: 5, label: `${faDigits(5)} دور` },
  { value: 10, label: `${faDigits(10)} دور` },
  { value: 15, label: `${faDigits(15)} دور (طولانی)` },
] as const;

const TIME_OPTIONS = [
  { value: 60, label: `${faDigits(60)} ثانیه` },
  { value: 90, label: `${faDigits(90)} ثانیه` },
  { value: 120, label: `${faDigits(2)} دقیقه` },
] as const;

const MIN_PLAYERS = 2;
const MAX_PLAYERS_UI = 12;

export function CreateRoomClient() {
  const router = useRouter();
  const [roomTitle, setRoomTitle] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [rounds, setRounds] = useState<(typeof ROUND_OPTIONS)[number]["value"]>(
    5,
  );
  const [seconds, setSeconds] = useState<(typeof TIME_OPTIONS)[number]["value"]>(
    60,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useSyncErrorToToast(error);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPost<{ roomCode: string }>("/api/room/create", {
        title: roomTitle.trim(),
        isPrivate: !isPublic,
        draftTotalRounds: rounds,
        draftRoundTimeSec: seconds,
        maxPlayers,
      });
      toast.success("اتاق ساخته شد. در حال ورود به لابی...");
      router.push(`/lobby/${data.roomCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir="rtl"
      lang="fa"
      className="min-h-[min(100dvh,880px)] bg-ka-background pb-44 text-ka-on-surface"
    >
      <h1 className="mb-6 text-center text-xl font-black text-violet-700 dark:text-violet-400">
        ایجاد اتاق بازی
      </h1>

      <main className="mx-auto max-w-2xl space-y-8 px-4 sm:px-6">
        <form id="create-room-form" onSubmit={handleCreate} className="space-y-8">
          <section className="space-y-6">
            <div>
              <label
                htmlFor="room-title"
                className="mb-2 block px-1 text-sm font-bold text-ka-primary"
              >
                نام اتاق بازی
              </label>
              <input
                id="room-title"
                name="title"
                required
                disabled={loading}
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                placeholder="مثلاً: جمع دوستانه جمعه‌ها"
                dir="rtl"
                className="w-full rounded-lg border-none bg-ka-surface-container-low p-5 text-right text-lg font-bold text-ka-on-surface transition-all placeholder:text-ka-outline-variant focus:ring-2 focus:ring-ka-primary/20 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsPublic(true)}
                className={cn(
                  "flex items-center justify-center gap-3 rounded-lg border-2 p-5 transition-transform active:scale-95 disabled:opacity-60",
                  isPublic
                    ? "border-ka-primary/20 bg-ka-primary-container text-ka-on-primary-container shadow-sm"
                    : "border-transparent bg-ka-surface-container-lowest text-zinc-500 hover:bg-ka-surface-container-high",
                )}
              >
                <Globe
                  className={cn(
                    "size-6 shrink-0",
                    isPublic
                      ? "text-ka-on-primary-container"
                      : "text-zinc-500",
                  )}
                  strokeWidth={isPublic ? 2.5 : 1.5}
                  aria-hidden
                />
                <span className="font-bold">عمومی</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsPublic(false)}
                className={cn(
                  "flex items-center justify-center gap-3 rounded-lg border-2 p-5 transition-transform active:scale-95 disabled:opacity-60",
                  !isPublic
                    ? "border-ka-primary/20 bg-ka-primary-container text-ka-on-primary-container shadow-sm"
                    : "border-transparent bg-ka-surface-container-lowest text-zinc-500 hover:bg-ka-surface-container-high",
                )}
              >
                <Lock
                  className={cn(
                    "size-6 shrink-0",
                    !isPublic
                      ? "text-ka-on-primary-container"
                      : "text-zinc-500",
                  )}
                  strokeWidth={!isPublic ? 2.5 : 1.5}
                  aria-hidden
                />
                <span className="font-bold">خصوصی</span>
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-6 rounded-lg bg-ka-surface-container-low p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="size-6 text-ka-primary" aria-hidden />
                  <span className="font-bold text-ka-on-surface">
                    تعداد بازیکنان
                  </span>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ka-primary text-lg font-bold text-white">
                  {faDigits(maxPlayers)}
                </span>
              </div>
              <input
                type="range"
                className="ka-room-slider w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                min={MIN_PLAYERS}
                max={MAX_PLAYERS_UI}
                value={maxPlayers}
                disabled={loading}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
              />
              <div className="flex justify-between text-xs font-medium text-ka-outline">
                <span>{faDigits(MAX_PLAYERS_UI)} نفر</span>
                <span>{faDigits(MIN_PLAYERS)} نفر</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4 rounded-lg bg-ka-surface-container-low p-6">
                <div className="flex items-center gap-2">
                  <ListOrdered className="size-6 text-ka-primary" aria-hidden />
                  <span className="font-bold text-ka-on-surface">
                    تعداد دورها
                  </span>
                </div>
                <div className="relative">
                  <select
                    value={rounds}
                    disabled={loading}
                    onChange={(e) =>
                      setRounds(Number(e.target.value) as typeof rounds)
                    }
                    className="w-full cursor-pointer appearance-none rounded-full border-none bg-ka-surface-container-lowest px-6 py-3 ps-10 font-bold text-ka-on-surface focus:ring-2 focus:ring-ka-primary/20 focus:outline-none disabled:opacity-60"
                  >
                    {ROUND_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ka-outline" aria-hidden />
                </div>
              </div>

              <div className="space-y-4 rounded-lg bg-ka-surface-container-low p-6">
                <div className="flex items-center gap-2">
                  <Timer className="size-6 text-ka-primary" aria-hidden />
                  <span className="font-bold text-ka-on-surface">
                    زمان هر دور
                  </span>
                </div>
                <div className="relative">
                  <select
                    value={seconds}
                    disabled={loading}
                    onChange={(e) =>
                      setSeconds(Number(e.target.value) as typeof seconds)
                    }
                    className="w-full cursor-pointer appearance-none rounded-full border-none bg-ka-surface-container-lowest px-6 py-3 ps-10 font-bold text-ka-on-surface focus:ring-2 focus:ring-ka-primary/20 focus:outline-none disabled:opacity-60"
                  >
                    {TIME_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ka-outline" aria-hidden />
                </div>
              </div>
            </div>
          </section>
        </form>

      </main>

      <footer className="fixed bottom-21 left-0 right-0 z-40 bg-linear-to-t from-ka-background via-ka-background/95 to-transparent px-4 pb-2 pt-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          <button
            type="submit"
            form="create-room-form"
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-linear-to-l from-ka-primary to-ka-primary-container py-5 text-xl font-extrabold text-white shadow-[0_8px_24px_rgba(99,14,212,0.3)] transition-all hover:shadow-[0_12px_32px_rgba(99,14,212,0.4)] active:scale-95 disabled:opacity-60"
          >
            <CirclePlus className="size-8 shrink-0" aria-hidden />
            <span>{loading ? "در حال ایجاد…" : "ایجاد اتاق"}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
