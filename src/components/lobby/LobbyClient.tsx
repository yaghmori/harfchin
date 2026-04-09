"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useFriendsForRoomQuery,
  useRoomChatQuery,
  useRoomStateQuery,
} from "@/hooks/api-queries";
import {
  useGameStartMutation,
  useRoomChatPostMutation,
  useRoomDeleteMutation,
  useRoomInviteMutation,
  useRoomKickMutation,
  useRoomLeaveMutation,
  useRoomReadyMutation,
  useRoomReplayMutation,
} from "@/hooks/api-mutations";
import { useRoomSse } from "@/features/realtime/useRoomSse";
import { API_ENDPOINTS } from "@/features/api/endpoints";
import { apiGet } from "@/features/api/client";
import type { AuthMePayload } from "@/hooks/api-queries";
import { faDigits } from "@/lib/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LobbyChat } from "./LobbyChat";
import { LobbyFinishedAlert } from "./LobbyFinishedAlert";
import { LobbyInviteFriendsSheet } from "./LobbyInviteFriendsSheet";
import { LobbyInviteLoginCta } from "./LobbyInviteLoginCta";
import { LobbyPlayersGrid } from "./LobbyPlayersGrid";
import { LobbyShareQrDialog } from "./LobbyShareQrDialog";
import { LobbyRoomSection } from "./LobbyRoomSection";
import type { Player } from "./types";

export function LobbyClient({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const [localError, setLocalError] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [showInviteLoginCta, setShowInviteLoginCta] = useState(false);
  const [showShareQr, setShowShareQr] = useState(false);
  const [deleteRoomDialogOpen, setDeleteRoomDialogOpen] = useState(false);
  const [leaveRoomDialogOpen, setLeaveRoomDialogOpen] = useState(false);
  const [kickTarget, setKickTarget] = useState<Pick<
    Player,
    "userId" | "displayName"
  > | null>(null);
  /** One automatic «آماده» per visit when the lobby is open (no manual ready button). */
  const autoReadyAttemptedRef = useRef(false);

  const roomQuery = useRoomStateQuery(roomCode);
  const chatQuery = useRoomChatQuery(roomCode);
  const friendsQuery = useFriendsForRoomQuery(roomCode);
  const readyMutation = useRoomReadyMutation();
  const startMutation = useGameStartMutation();
  const replayMutation = useRoomReplayMutation();
  const deleteRoomMutation = useRoomDeleteMutation();
  const leaveRoomMutation = useRoomLeaveMutation();
  const kickMutation = useRoomKickMutation();
  const chatMutation = useRoomChatPostMutation();
  const inviteMutation = useRoomInviteMutation();
  const state = roomQuery.data ?? null;
  const messages = chatQuery.data?.messages ?? [];
  const queryError =
    roomQuery.error instanceof Error ? roomQuery.error.message : null;
  const error = localError ?? queryError;
  const busy =
    readyMutation.isPending ||
    startMutation.isPending ||
    replayMutation.isPending ||
    deleteRoomMutation.isPending ||
    leaveRoomMutation.isPending ||
    kickMutation.isPending;
  const chatBusy = chatMutation.isPending;
  const inviteBusy = inviteMutation.isPending;

  useEffect(() => {
    if (state?.status === "playing" && state.activeGameId) {
      router.push(`/game/${state.roomCode}`);
    }
  }, [state, router]);

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
        await readyMutation.mutateAsync({
          roomCode: state.roomCode,
          isReady: true,
        });
        await roomQuery.refetch();
        setLocalError(null);
      } catch (e) {
        autoReadyAttemptedRef.current = false;
        setLocalError(e instanceof Error ? e.message : "خطا");
      }
    })();
  }, [state, me, readyMutation, roomQuery]);

  useRoomSse(roomCode, () => {
    void roomQuery.refetch();
    void chatQuery.refetch();
    void friendsQuery.refetch();
  });

  const isHost = state?.hostId === state?.meUserId;
  const hostPresentInLobby = state?.hostPresentInLobby ?? false;
  const hostPlayer =
    hostPresentInLobby && state
      ? state.players.find((p) => p.userId === state.hostId)
      : undefined;
  const otherPlayers =
    state?.players.filter((p) => p.userId !== state.hostId) ?? [];
  const emptySlots = state
    ? Math.max(0, state.maxPlayers - state.players.length)
    : 0;

  async function startGame() {
    if (!state) return;
    try {
      await startMutation.mutateAsync({ roomCode: state.roomCode });
      setLocalError(null);
      router.push(`/game/${state.roomCode}`);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "خطا");
    }
  }

  async function replayLobby() {
    if (!state) return;
    try {
      await replayMutation.mutateAsync({ roomCode: state.roomCode });
      await roomQuery.refetch();
      setLocalError(null);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "خطا");
    }
  }

  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!state) return;
    const body = chatDraft.trim();
    if (!body || chatBusy) return;
    try {
      await chatMutation.mutateAsync({
        roomCode: state.roomCode,
        body,
      });
      setChatDraft("");
      await chatQuery.refetch();
      setLocalError(null);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "خطا");
    }
  }

  async function inviteFriend(friendUserId: string) {
    if (!state) return;
    try {
      await inviteMutation.mutateAsync({ roomCode: state.roomCode, friendUserId });
      setLocalError(null);
      await friendsQuery.refetch();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "خطا");
    }
  }

  async function openInviteFromEmptySlot() {
    try {
      const { user } = await apiGet<AuthMePayload>(API_ENDPOINTS.auth.me);
      if (user?.isRegistered) {
        setShowInviteSheet(true);
      } else {
        setShowInviteLoginCta(true);
      }
    } catch {
      setShowInviteLoginCta(true);
    }
  }

  function requestDeleteRoom() {
    if (!state) return;
    setDeleteRoomDialogOpen(true);
  }

  async function confirmDeleteRoom() {
    if (!state) return;
    try {
      await deleteRoomMutation.mutateAsync({ roomCode: state.roomCode });
      setLocalError(null);
      setDeleteRoomDialogOpen(false);
      router.push("/");
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "خطا");
    }
  }

  function requestLeaveLobby() {
    setLeaveRoomDialogOpen(true);
  }

  async function confirmLeaveLobby() {
    if (!state) return;
    try {
      await leaveRoomMutation.mutateAsync({ roomCode: state.roomCode });
      setLocalError(null);
      setLeaveRoomDialogOpen(false);
      router.push("/");
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "خطا");
    } finally {
      leaveRoomMutation.reset();
    }
  }

  async function confirmKickPlayer() {
    if (!state || !kickTarget) return;
    try {
      await kickMutation.mutateAsync({
        roomCode: state.roomCode,
        targetUserId: kickTarget.userId,
      });
      setLocalError(null);
      setKickTarget(null);
      await roomQuery.refetch();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "خطا");
    } finally {
      kickMutation.reset();
    }
  }

  if (error && !state) {
    return (
      <div
        className="relative min-h-dvh bg-background px-4 py-8 text-foreground"
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
        className="relative flex min-h-dvh items-center justify-center bg-background text-muted-foreground"
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
    state.hostPresentInLobby &&
    state.players.length >= state.minPlayersToStart &&
    allReady &&
    state.status === "waiting";

  return (
    <div
      className="relative min-h-dvh bg-background text-foreground selection:bg-primary/20 selection:text-primary"
      dir="rtl"
    >
      <div
        className="pointer-events-none fixed top-[20%] -left-20 -z-10 size-64 rounded-full bg-primary/5 blur-[80px]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-[10%] -right-20 -z-10 size-96 rounded-full bg-secondary/30 blur-[100px]"
        aria-hidden
      />

      <main className="mx-auto max-w-5xl px-0 pb-8 pt-4 md:px-2 md:pb-10">
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {state.status === "waiting" && !state.hostPresentInLobby ? (
          <Alert className="mb-4 border-amber-500/35 bg-amber-500/10 text-foreground dark:border-amber-500/25 dark:bg-amber-950/40">
            <AlertDescription className="text-sm font-medium leading-relaxed">
              میزبان در لابی حضور ندارد. کارت میزبان نمایش داده نمی‌شود و بازی
              فقط پس از بازگشت میزبان به لابی و آماده بودن همه بازیکنان قابل
              شروع است.
            </AlertDescription>
          </Alert>
        ) : null}

        <LobbyRoomSection
          state={state}
          isHost={!!isHost}
          canInvite={!!state.canInvite}
          canStart={canStart}
          busy={busy}
          onOpenShareDialog={() => setShowShareQr(true)}
          onDeleteRoom={requestDeleteRoom}
          onStartGame={startGame}
          onLeaveRoom={isHost ? undefined : requestLeaveLobby}
        />

        <LobbyShareQrDialog
          open={showShareQr}
          onOpenChange={setShowShareQr}
          roomCode={state.roomCode}
        />

        <LobbyInviteFriendsSheet
          open={showInviteSheet}
          onOpenChange={setShowInviteSheet}
          roomIsPrivate={state.isPrivate}
          canInvite={!!friendsQuery.data?.canInvite}
          items={friendsQuery.data?.items ?? []}
          inviteBusy={inviteBusy}
          onInvite={inviteFriend}
        />

        <LobbyInviteLoginCta
          open={showInviteLoginCta}
          onOpenChange={setShowInviteLoginCta}
          roomCode={state.roomCode}
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
          onEmptySlotInvite={() => void openInviteFromEmptySlot()}
          onRequestKick={
            isHost && state.status === "waiting"
              ? (p) => setKickTarget(p)
              : undefined
          }
        />

        <p className="mb-8 rounded-2xl bg-secondary px-3 py-2 text-center text-xs font-medium text-muted-foreground">
          {state.status === "waiting" && !state.hostPresentInLobby ? (
            <>
              تا بازگشت میزبان به لابی، بازی شروع نمی‌شود. با باز بودن این صفحه
              وضعیت شما «آماده» ثبت می‌شود.
            </>
          ) : (
            <>
              با باز بودن این صفحه وضعیت شما «آماده» ثبت می‌شود. میزبان وقتی
              حداقل {faDigits(state.minPlayersToStart)} نفر در اتاق باشند و همه
              آماده باشند می‌تواند بازی را شروع کند.
            </>
          )}
        </p>

        <Separator className="mb-8 bg-border/60" />

        <LobbyChat
          messages={messages}
          meUserId={state.meUserId}
          chatDraft={chatDraft}
          onChatDraftChange={setChatDraft}
          onSubmit={sendChat}
          chatBusy={chatBusy}
          chatDisabled={state.status === "finished"}
          onRefreshMessages={() => void chatQuery.refetch()}
          chatRefreshing={chatQuery.isFetching}
        />
      </main>

      <AlertDialog
        open={deleteRoomDialogOpen}
        onOpenChange={setDeleteRoomDialogOpen}
      >
        <AlertDialogContent dir="rtl" className="text-right">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف اتاق؟</AlertDialogTitle>
            <AlertDialogDescription>
              اتاق برای همه بازیکنان حذف می‌شود و این عمل برگشت‌پذیر نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-row-reverse">
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              className="min-h-11 w-full sm:w-auto"
              onClick={() => void confirmDeleteRoom()}
            >
              حذف اتاق
            </Button>
            <AlertDialogCancel className="border-border">
              انصراف
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={kickTarget !== null}
        onOpenChange={(open) => {
          if (!open) setKickTarget(null);
        }}
      >
        <AlertDialogContent dir="rtl" className="text-right">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف بازیکن از اتاق؟</AlertDialogTitle>
            <AlertDialogDescription>
              {kickTarget
                ? `«${kickTarget.displayName}» از این اتاق خارج می‌شود و می‌تواند بعداً دوباره بپیوندد.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-row-reverse">
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              className="min-h-11 w-full sm:w-auto"
              onClick={() => void confirmKickPlayer()}
            >
              حذف از اتاق
            </Button>
            <AlertDialogCancel className="border-border">
              انصراف
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={leaveRoomDialogOpen}
        onOpenChange={setLeaveRoomDialogOpen}
      >
        <AlertDialogContent dir="rtl" className="text-right">
          <AlertDialogHeader>
            <AlertDialogTitle>خروج از اتاق؟</AlertDialogTitle>
            <AlertDialogDescription>
              از این اتاق خارج می‌شوید و می‌توانید بعداً دوباره بپیوندید.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-row-reverse">
            <Button
              type="button"
              variant="default"
              disabled={busy}
              className="min-h-11 w-full sm:w-auto"
              onClick={() => void confirmLeaveLobby()}
            >
              خروج
            </Button>
            <AlertDialogCancel className="border-border">
              ماندن
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
