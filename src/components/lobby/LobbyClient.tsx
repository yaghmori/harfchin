"use client";

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
import { Separator } from "@/components/ui/separator";
import { apiGet, apiPost } from "@/features/api/client";
import { useRoomSse } from "@/features/realtime/useRoomSse";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/constants";
import { faDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Coins,
  Copy,
  Gamepad2,
  LogOut,
  MessageCircle,
  MoreVertical,
  Play,
  Send,
  Settings,
  Smile,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Player = {
  id: string;
  userId: string;
  displayName: string;
  isHost: boolean;
  isReady: boolean;
};

type RoomState = {
  roomCode: string;
  title: string;
  isPrivate: boolean;
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

type ChatMessage = {
  id: string;
  userId: string;
  displayName: string;
  body: string;
  createdAt: string;
};

function initials(name: string) {
  const t = name.trim();
  if (!t) return "?";
  return t.slice(0, 1);
}

function PlayerAvatar({
  name,
  size = "md",
  dimmed,
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  dimmed?: boolean;
  className?: string;
}) {
  const sz =
    size === "lg"
      ? "size-16 text-xl"
      : size === "sm"
        ? "size-8 text-xs"
        : "size-14 text-lg";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-ka-primary-fixed font-black text-ka-on-primary-fixed ring-ka-primary/10",
        sz,
        dimmed && "opacity-40 grayscale",
        size === "lg" && "ring-4 ring-ka-primary-fixed",
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}

export function LobbyClient({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const [state, setState] = useState<RoomState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  /** One automatic «آماده» per visit when the lobby is open (no manual ready button). */
  const autoReadyAttemptedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<RoomState>(
        `/api/room/state?code=${encodeURIComponent(roomCode)}`,
      );
      setState(data);
      setError(null);
      if (data.status === "playing" && data.activeGameId) {
        router.push(`/game/${data.roomCode}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    }
  }, [roomCode, router]);

  const loadChat = useCallback(async () => {
    try {
      const data = await apiGet<{ messages: ChatMessage[] }>(
        `/api/room/chat?code=${encodeURIComponent(roomCode)}`,
      );
      setMessages(data.messages);
    } catch {
      /* non-members or transient errors — avoid breaking lobby */
    }
  }, [roomCode]);

  const refresh = useCallback(() => {
    void load();
    void loadChat();
  }, [load, loadChat]);

  useEffect(() => {
    void load();
    void loadChat();
  }, [load, loadChat]);

  const me = state?.players.find((p) => p.userId === state.meUserId);

  useEffect(() => {
    autoReadyAttemptedRef.current = false;
  }, [roomCode]);

  useEffect(() => {
    if (!state || state.status !== "waiting" || !me || me.isReady) return;
    if (autoReadyAttemptedRef.current) return;
    autoReadyAttemptedRef.current = true;
    void (async () => {
      try {
        await apiPost("/api/room/ready", {
          roomCode: state.roomCode,
          isReady: true,
        });
        await load();
      } catch (e) {
        autoReadyAttemptedRef.current = false;
        setError(e instanceof Error ? e.message : "خطا");
      }
    })();
  }, [state, me, load]);

  useRoomSse(roomCode, refresh);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isHost = state?.hostId === state?.meUserId;
  const hostPlayer =
    state?.players.find((p) => p.isHost) ?? state?.players[0];
  const otherPlayers =
    state?.players.filter((p) => p.id !== hostPlayer?.id) ?? [];
  const emptySlots = state
    ? Math.max(0, state.maxPlayers - state.players.length)
    : 0;

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

  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!state) return;
    const body = chatDraft.trim();
    if (!body || chatBusy) return;
    setChatBusy(true);
    try {
      await apiPost("/api/room/chat", {
        roomCode: state.roomCode,
        body,
      });
      setChatDraft("");
      await loadChat();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    } finally {
      setChatBusy(false);
    }
  }

  async function copyRoomCode() {
    if (!state || typeof navigator.clipboard?.writeText !== "function") return;
    try {
      await navigator.clipboard.writeText(state.roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setError("کپی کد ناموفق بود.");
    }
  }

  async function copyInviteLink() {
    if (!state || typeof navigator.clipboard?.writeText !== "function") return;
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/join?code=${encodeURIComponent(state.roomCode)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    } catch {
      setError("کپی لینک ناموفق بود.");
    }
  }

  if (error && !state) {
    return (
      <div
        className="relative min-h-dvh bg-ka-background px-4 py-8 text-ka-on-background"
        dir="rtl"
      >
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
      </div>
    );
  }

  if (!state) {
    return (
      <div
        className="relative flex min-h-dvh items-center justify-center bg-ka-background text-ka-on-surface-variant"
        dir="rtl"
      >
        <p className="text-sm font-semibold">در حال بارگذاری لابی…</p>
      </div>
    );
  }

  const allReady =
    state.players.length > 0 && state.players.every((p) => p.isReady);
  const canStart =
    isHost &&
    state.players.length >= state.minPlayersToStart &&
    allReady &&
    state.status === "waiting";

  const displayTitle =
    state.title.trim().length > 0 ? state.title.trim() : "حرفچین";

  return (
    <div
      className="relative min-h-dvh bg-ka-background text-ka-on-background selection:bg-ka-primary-fixed selection:text-ka-on-primary-fixed"
      dir="rtl"
    >
      <div
        className="pointer-events-none fixed top-[20%] -left-20 -z-10 size-64 rounded-full bg-ka-primary/5 blur-[80px]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-[10%] -right-20 -z-10 size-96 rounded-full bg-ka-secondary/5 blur-[100px]"
        aria-hidden
      />

      <header className="fixed top-0 z-50 flex w-full items-center justify-between px-4 py-4 shadow-[0_12px_32px_rgba(25,28,29,0.06)] backdrop-blur-xl md:px-6 bg-white/80 dark:bg-zinc-950/80">
        <div className="flex items-center gap-2 rounded-full border border-ka-secondary-container/30 bg-ka-secondary-container/20 px-3 py-1.5">
          <Coins
            className="size-4 text-ka-secondary shrink-0"
            aria-hidden
          />
          <span className="text-xs font-bold text-ka-secondary">
            {faDigits(0)} سکه
          </span>
        </div>
        <h1 className="truncate text-center text-lg font-black tracking-tight text-ka-primary md:text-xl">
          {displayTitle}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-ka-on-surface-variant hover:text-destructive"
            onClick={() => void leave()}
            disabled={busy}
            aria-label="ترک اتاق"
          >
            <LogOut className="size-4" />
          </Button>
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ka-surface-container-high ring-2 ring-ka-primary/10">
            <span className="text-sm font-black text-ka-primary">
              {me ? initials(me.displayName) : "?"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-32 pt-24 md:px-6 md:pb-10">
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <section className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ka-primary/70">
              شناسه اتاق انتظار
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h2
                className="text-4xl font-black tracking-tighter text-ka-on-background md:text-5xl"
                dir="ltr"
              >
                {state.roomCode}
              </h2>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="rounded-full shadow-none"
                onClick={() => void copyRoomCode()}
                aria-label="کپی کد اتاق"
              >
                <Copy className="size-5 text-ka-primary" />
              </Button>
              {copiedCode ? (
                <span className="text-xs font-bold text-green-600">
                  کپی شد
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1 rounded-2xl border-0 bg-ka-surface-container-highest text-ka-on-primary-fixed-variant shadow-none hover:bg-ka-primary-fixed min-w-[140px]"
              onClick={() => void copyInviteLink()}
              disabled={busy}
            >
              <UserPlus className="size-5" />
              {copiedInvite ? "لینک کپی شد" : "دعوت دوستان"}
            </Button>
            {isHost ? (
              <Button
                type="button"
                variant="default"
                size="lg"
                className="flex-[1.25] min-w-[160px] rounded-2xl shadow-[0_12px_32px_rgba(25,28,29,0.06)] disabled:opacity-45"
                onClick={() => void startGame()}
                disabled={!canStart || busy || state.status === "finished"}
              >
                شروع بازی
                <Play className="size-5" aria-hidden />
              </Button>
            ) : null}
          </div>
        </section>

        {state.status === "finished" && state.lastFinishedGameId ? (
          <Alert className="mb-6 border-amber-400/35 bg-gradient-to-br from-amber-50 to-orange-50/80 dark:from-amber-950/40 dark:to-orange-950/20">
            <AlertDescription className="flex flex-col gap-3 text-foreground">
              <span className="font-bold">این بازی به پایان رسیده است.</span>
              <Button
                render={<Link href={`/results/${state.lastFinishedGameId}`} />}
                nativeButton={false}
                variant="default"
                className="w-full rounded-2xl"
              >
                مشاهده نتایج
              </Button>
              {isHost ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void replayLobby()}
                  className="w-full rounded-2xl"
                >
                  بازی دوباره
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {hostPlayer ? (
            <Card className="col-span-2 flex flex-row items-center justify-between border-ka-primary/15 py-5 shadow-[0_12px_32px_rgba(25,28,29,0.06)]">
              <CardContent className="flex flex-1 items-center gap-5 p-0 px-5">
                <div className="relative shrink-0">
                  <PlayerAvatar
                    name={hostPlayer.displayName}
                    size="lg"
                    dimmed={!hostPlayer.isReady}
                  />
                  <div className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-white bg-ka-secondary-container">
                    <span className="text-[10px] font-black text-ka-on-secondary-container">
                      ★
                    </span>
                  </div>
                </div>
                <div className="min-w-0 text-start">
                  <h3 className="truncate text-lg font-black">
                    {hostPlayer.displayName}
                    {hostPlayer.userId === state.meUserId ? " (شما)" : ""}
                  </h3>
                  <p className="text-xs font-bold text-ka-primary">میزبان اتاق</p>
                </div>
              </CardContent>
              <div className="px-4">
                <Badge
                  className={cn(
                    "rounded-full px-3 py-1 text-[10px] font-black",
                    hostPlayer.isReady
                      ? "border-0 bg-ka-primary-fixed text-ka-on-primary-fixed-variant"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {hostPlayer.isReady ? "آماده" : "در انتظار"}
                </Badge>
              </div>
            </Card>
          ) : null}

          {otherPlayers.map((p) => (
            <Card
              key={p.id}
              className="border-transparent py-5 text-center shadow-[0_12px_32px_rgba(25,28,29,0.04)] transition-colors hover:border-ka-primary/20"
            >
              <CardContent className="flex flex-col items-center gap-3 p-0 px-3">
                <PlayerAvatar
                  name={p.displayName}
                  dimmed={!p.isReady}
                />
                <span
                  className={cn(
                    "text-sm font-bold",
                    !p.isReady && "opacity-50",
                  )}
                >
                  {p.displayName}
                  {p.userId === state.meUserId ? " (شما)" : ""}
                </span>
                <Badge
                  className={cn(
                    "rounded-full px-3 py-0.5 text-[9px] font-black",
                    p.isReady
                      ? "border-0 bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                      : "border-0 bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                  )}
                >
                  {p.isReady ? "آماده" : "در انتظار"}
                </Badge>
              </CardContent>
            </Card>
          ))}

          {Array.from({ length: emptySlots }).map((_, i) => (
            <button
              key={`empty-${i}`}
              type="button"
              className="flex min-h-[140px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-ka-outline-variant/40 bg-transparent p-5 text-ka-outline transition-colors hover:border-ka-primary/40"
              onClick={() => void copyInviteLink()}
            >
              <span className="text-2xl text-ka-outline-variant">+</span>
              <span className="text-[10px] font-bold">ظرفیت خالی</span>
            </button>
          ))}
        </section>

        <p className="mb-8 rounded-2xl bg-ka-surface-container-low px-3 py-2 text-center text-xs font-medium text-ka-on-surface-variant">
          با باز بودن این صفحه وضعیت شما «آماده» ثبت می‌شود. میزبان وقتی حداقل{" "}
          {faDigits(state.minPlayersToStart)} نفر در اتاق باشند و همه آماده باشند
          می‌تواند بازی را شروع کند.
        </p>

        <Separator className="mb-8 bg-ka-outline-variant/40" />

        <section className="mb-4">
          <Card className="flex max-h-[min(500px,55vh)] flex-col overflow-hidden rounded-[2rem] border-ka-surface-container-high shadow-[0_12px_32px_rgba(25,28,29,0.06)]">
            <CardHeader className="flex flex-row items-center justify-between border-b border-ka-surface-container bg-ka-surface-container-lowest/50 py-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-xl bg-ka-primary/10">
                  <MessageCircle className="size-5 text-ka-primary" aria-hidden />
                </div>
                <div>
                  <CardTitle className="text-sm font-black">گپ و گفت اتاق</CardTitle>
                  <p className="text-[9px] font-bold text-ka-primary/60">
                    پیام‌ها برای اعضای اتاق ذخیره می‌شوند
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-ka-on-surface-variant"
                aria-label="بیشتر"
              >
                <MoreVertical className="size-4" />
              </Button>
            </CardHeader>
            <CardContent
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto scroll-smooth bg-[radial-gradient(#e8e8e8_1px,transparent_1px)] [background-size:20px_20px] py-4 dark:bg-[radial-gradient(rgb(39_39_42/0.5)_1px,transparent_1px)]"
            >
              <div className="space-y-5 px-2">
                {messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-ka-on-surface-variant">
                    هنوز پیامی نیست — اولین نفری باشید که سلام می‌کند.
                  </p>
                ) : null}
                {messages.map((m) => {
                  const mine = m.userId === state.meUserId;
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "flex max-w-[85%] items-end gap-3",
                        mine && "mr-auto flex-row-reverse",
                      )}
                    >
                      {!mine ? (
                        <PlayerAvatar name={m.displayName} size="sm" />
                      ) : null}
                      <div
                        className={cn(
                          "min-w-0 space-y-1",
                          mine && "flex flex-col items-end",
                        )}
                      >
                        <span
                          className={cn(
                            "block text-[10px] font-bold",
                            mine ? "text-ka-primary/60" : "text-muted-foreground",
                          )}
                        >
                          {mine ? "شما" : m.displayName}
                        </span>
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-sm",
                            mine
                              ? "rounded-bl-md bg-ka-primary text-white shadow-md shadow-ka-primary/25"
                              : "rounded-br-md bg-ka-surface-container-low text-ka-on-background",
                          )}
                        >
                          {m.body}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
            <CardFooter className="border-t border-ka-surface-container bg-ka-surface-container-lowest">
              <form
                className="flex w-full items-center gap-2"
                onSubmit={sendChat}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  className="shrink-0 text-ka-on-surface-variant hover:text-ka-primary"
                  aria-label="ایموجی"
                  onClick={() => {
                    setChatDraft((d) => d + "😊");
                  }}
                >
                  <Smile className="size-6" />
                </Button>
                <Input
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  placeholder="پیامی بنویسید…"
                  maxLength={MAX_CHAT_MESSAGE_LENGTH}
                  disabled={chatBusy || state.status === "finished"}
                  className="h-12 flex-1 rounded-2xl border-0 text-sm"
                  dir="auto"
                />
                <Button
                  type="submit"
                  variant="default"
                  size="icon-lg"
                  className="shrink-0 rounded-2xl shadow-lg shadow-ka-primary/20"
                  disabled={
                    chatBusy ||
                    !chatDraft.trim() ||
                    state.status === "finished"
                  }
                  aria-label="ارسال"
                >
                  <Send className="size-5 rtl:rotate-180" />
                </Button>
              </form>
            </CardFooter>
          </Card>
        </section>
      </main>

      <nav
        className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-[2.5rem] border-t border-ka-surface-container-high bg-white/90 px-2 pt-3 pb-6 shadow-[0_-8px_24px_rgba(0,0,0,0.04)] backdrop-blur-lg md:hidden dark:bg-zinc-950/90"
        aria-label="ناوبری اصلی"
      >
        <span className="flex flex-col items-center justify-center rounded-2xl bg-ka-primary/10 px-4 py-2 text-ka-primary">
          <Gamepad2 className="size-6" aria-hidden />
          <span className="mt-0.5 text-[10px] font-black">بازی</span>
        </span>
        <Button
          render={<Link href="/rooms" />}
          nativeButton={false}
          variant="ghost"
          className="h-auto flex-col gap-0.5 rounded-2xl px-4 py-2 text-ka-on-surface-variant hover:text-ka-primary"
        >
          <Users className="size-6" />
          <span className="text-[10px] font-bold">روم‌ها</span>
        </Button>
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          variant="ghost"
          className="h-auto flex-col gap-0.5 rounded-2xl px-4 py-2 text-ka-on-surface-variant hover:text-ka-primary"
        >
          <Trophy className="size-6" />
          <span className="text-[10px] font-bold">رتبه‌بندی</span>
        </Button>
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          variant="ghost"
          className="h-auto flex-col gap-0.5 rounded-2xl px-4 py-2 text-ka-on-surface-variant hover:text-ka-primary"
        >
          <Settings className="size-6" />
          <span className="text-[10px] font-bold">تنظیمات</span>
        </Button>
      </nav>
    </div>
  );
}
