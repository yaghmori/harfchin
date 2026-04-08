"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiGet, apiPost } from "@/features/api/client";
import { useRoomSse } from "@/features/realtime/useRoomSse";
import { faDigits } from "@/lib/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LobbyChat } from "./LobbyChat";
import { LobbyFinishedAlert } from "./LobbyFinishedAlert";
import { LobbyHeader } from "./LobbyHeader";
import { LobbyPlayersGrid } from "./LobbyPlayersGrid";
import { LobbyRoomSection } from "./LobbyRoomSection";
import type { ChatMessage, RoomState } from "./types";

export function LobbyClient({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const [state, setState] = useState<RoomState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
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

  async function openQr() {
    if (!state) return;
    try {
      if (!qrDataUrl) {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const url = `${origin}/join?code=${encodeURIComponent(state.roomCode)}`;
        const { default: QRCode } = await import("qrcode");
        const dataUrl = await QRCode.toDataURL(url, {
          margin: 2,
          width: 240,
          color: { dark: "#191c1dff", light: "#ffffffff" },
        });
        setQrDataUrl(dataUrl);
      }
      setShowQr(true);
    } catch {
      setError("ساخت QR ناموفق بود.");
    }
  }

  async function shareInvite() {
    if (!state) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/join?code=${encodeURIComponent(state.roomCode)}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: `دعوت به اتاق ${state.title || state.roomCode}`,
          text: "برای پیوستن به بازی، این لینک را باز کنید",
          url,
        });
      } else {
        await copyInviteLink();
      }
    } catch {
      /* user cancelled share sheet */
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

      <LobbyHeader
        displayTitle={displayTitle}
        meDisplayName={me?.displayName ?? null}
        busy={busy}
        onLeave={leave}
      />

      <main className="mx-auto max-w-5xl px-0 pb-8 pt-2 md:px-2 md:pb-10">
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <LobbyRoomSection
          state={state}
          isHost={!!isHost}
          canStart={canStart}
          busy={busy}
          copiedInvite={copiedInvite}
          qrDataUrl={qrDataUrl}
          showQr={showQr}
          onOpenQr={openQr}
          onCloseQr={() => setShowQr(false)}
          onShareInvite={shareInvite}
          onCopyInviteLink={copyInviteLink}
          onStartGame={startGame}
        />

        <LobbyFinishedAlert
          state={state}
          isHost={!!isHost}
          busy={busy}
          onReplay={replayLobby}
        />

        <LobbyPlayersGrid
          state={state}
          hostPlayer={hostPlayer}
          otherPlayers={otherPlayers}
          emptySlots={emptySlots}
          onCopyInviteLink={copyInviteLink}
        />

        <p className="mb-8 rounded-2xl bg-ka-surface-container-low px-3 py-2 text-center text-xs font-medium text-ka-on-surface-variant">
          با باز بودن این صفحه وضعیت شما «آماده» ثبت می‌شود. میزبان وقتی حداقل{" "}
          {faDigits(state.minPlayersToStart)} نفر در اتاق باشند و همه آماده باشند
          می‌تواند بازی را شروع کند.
        </p>

        <Separator className="mb-8 bg-ka-outline-variant/40" />

        <LobbyChat
          messages={messages}
          meUserId={state.meUserId}
          chatDraft={chatDraft}
          onChatDraftChange={setChatDraft}
          onSubmit={sendChat}
          chatBusy={chatBusy}
          chatDisabled={state.status === "finished"}
        />
      </main>
    </div>
  );
}
