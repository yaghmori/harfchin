"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  CirclePlus,
  Copy,
  Globe,
  ListOrdered,
  Loader2,
  Lock,
  PlayCircle,
  Settings,
  Timer,
  Users,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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

type CreateRoomInvitePanelProps = {
  loading: boolean;
  qrDataUrl: string | null;
  joinUrl: string;
  copyDone: boolean;
  onCopyInvite: () => void;
};

function CreateRoomInvitePanel({
  loading,
  qrDataUrl,
  joinUrl,
  copyDone,
  onCopyInvite,
}: CreateRoomInvitePanelProps) {
  return (
    <section className="space-y-6 rounded-xl border border-ka-surface-container-high bg-white p-8 text-center shadow-[0_12px_32px_rgba(25,28,29,0.06)] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="inline-block rounded-lg border-2 border-dashed border-ka-primary/20 bg-ka-surface-container-lowest p-4">
        {qrDataUrl ? (
          <Image
            src={qrDataUrl}
            alt="کد QR ورود به اتاق"
            width={160}
            height={160}
            unoptimized
            className="mx-auto size-40 rounded-md"
          />
        ) : (
          <div
            className="flex size-40 flex-col items-center justify-center gap-2 rounded-md bg-ka-surface-container-low"
            aria-busy="true"
          >
            <Loader2
              className="size-10 shrink-0 animate-spin text-ka-primary"
              aria-hidden
            />
            <span className="sr-only">
              {loading ? "در حال ایجاد اتاق…" : "در حال ساخت کد QR…"}
            </span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <p className="font-bold text-ka-on-surface">
          برای دعوت سریع، این کد را با دوستانتان به اشتراک بگذارید
        </p>
        <p className="text-sm text-ka-outline">
          دوستان شما با اسکن این کد مستقیماً وارد این اتاق می‌شوند
        </p>
      </div>
      <button
        type="button"
        onClick={() => void onCopyInvite()}
        disabled={!joinUrl}
        className="mx-auto flex items-center justify-center gap-2 rounded-full border border-ka-primary/20 px-6 py-2 text-sm font-bold text-ka-primary transition-colors hover:bg-ka-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Copy className="size-4 shrink-0" aria-hidden />
        <span>{copyDone ? "کپی شد!" : "کپی کردن لینک دعوت"}</span>
      </button>
    </section>
  );
}

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
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copyDone, setCopyDone] = useState(false);

  useSyncErrorToToast(error);

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined" || !createdRoomCode) return "";
    const u = new URL("/join", window.location.origin);
    u.searchParams.set("code", createdRoomCode);
    return u.toString();
  }, [createdRoomCode]);

  const buildQr = useCallback(async (url: string) => {
    if (!url) {
      setQrDataUrl(null);
      return;
    }
    const { default: QRCode } = await import("qrcode");
    const dataUrl = await QRCode.toDataURL(url, {
      margin: 2,
      width: 200,
      color: { dark: "#191c1dff", light: "#ffffffff" },
    });
    setQrDataUrl(dataUrl);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (createdRoomCode) return;
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
      setCreatedRoomCode(data.roomCode);
      toast.success("اتاق ساخته شد. کد را با دوستان به اشتراک بگذارید.");
      const invite = new URL("/join", window.location.origin);
      invite.searchParams.set("code", data.roomCode);
      void buildQr(invite.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }

  async function copyInviteLink() {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopyDone(true);
      toast.success("لینک دعوت در کلیپ‌بورد کپی شد.");
      setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setError("کپی در این مرورگر در دسترس نیست.");
    }
  }

  const formLocked = Boolean(createdRoomCode);

  return (
    <div
      dir="rtl"
      lang="fa"
      className="min-h-[max(884px,100dvh)] bg-ka-background pb-40 text-ka-on-surface"
    >
      <header className="fixed top-0 z-50 h-16 w-full bg-white/80 shadow-[0_12px_32px_rgba(25,28,29,0.06)] backdrop-blur-xl dark:bg-zinc-950/80">
        <div className="mx-auto flex h-full w-full max-w-screen-xl items-center justify-between px-6">
          <Link
            href="/"
            className="scale-95 text-violet-700 transition-transform active:scale-90 dark:text-violet-400"
            aria-label="بازگشت"
          >
            <ArrowRight className="size-8" aria-hidden />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-violet-700 dark:text-violet-400">
            ایجاد اتاق بازی
          </h1>
          <button
            type="button"
            className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-violet-50 dark:hover:bg-violet-900/30"
            aria-label="تنظیمات"
            disabled
          >
            <Settings className="size-6" aria-hidden />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 px-6 pt-24">
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
                disabled={formLocked}
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
                disabled={formLocked}
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
                disabled={formLocked}
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
                disabled={formLocked}
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
                    disabled={formLocked}
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
                    disabled={formLocked}
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

        {loading || createdRoomCode ? (
          <CreateRoomInvitePanel
            loading={loading}
            qrDataUrl={qrDataUrl}
            joinUrl={joinUrl}
            copyDone={copyDone}
            onCopyInvite={copyInviteLink}
          />
        ) : null}
      </main>

      <footer className="fixed bottom-0 left-0 z-40 w-full bg-gradient-to-t from-ka-background via-ka-background/95 to-transparent p-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {!createdRoomCode ? (
            <button
              type="submit"
              form="create-room-form"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-l from-ka-primary to-ka-primary-container py-5 text-xl font-extrabold text-white shadow-[0_8px_24px_rgba(99,14,212,0.3)] transition-all hover:shadow-[0_12px_32px_rgba(99,14,212,0.4)] active:scale-95 disabled:opacity-60"
            >
              <CirclePlus className="size-8 shrink-0" aria-hidden />
              <span>{loading ? "در حال ایجاد…" : "ایجاد اتاق"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push(`/lobby/${createdRoomCode}`)}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-l from-ka-primary to-ka-primary-container py-5 text-xl font-extrabold text-white shadow-[0_8px_24px_rgba(99,14,212,0.3)] transition-all hover:shadow-[0_12px_32px_rgba(99,14,212,0.4)] active:scale-95"
            >
              <PlayCircle className="size-8 shrink-0" aria-hidden />
              <span>ورود به لابی</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
