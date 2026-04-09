import { Button } from "@/components/ui/button";
import { LogOut, Play, Share2, Trash2 } from "lucide-react";
import type { RoomState } from "./types";

type LobbyRoomSectionProps = {
  state: RoomState;
  isHost: boolean;
  canInvite: boolean;
  canStart: boolean;
  busy: boolean;
  onOpenShareDialog: () => void;
  onDeleteRoom: () => void;
  onStartGame: () => void;
  /** Non-host: leave lobby (shown as icon before share). */
  onLeaveRoom?: () => void;
};

export function LobbyRoomSection({
  state,
  isHost,
  canInvite,
  canStart,
  busy,
  onOpenShareDialog,
  onDeleteRoom,
  onStartGame,
  onLeaveRoom,
}: LobbyRoomSectionProps) {
  const roomTitle = state.title.trim() || `اتاق ${state.roomCode}`;
  return (
    <section className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
          اتاق انتظار
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-4xl font-black tracking-tighter text-foreground md:text-5xl">
            {roomTitle}
          </h2>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {isHost ? (
          <Button
            type="button"
            variant="destructive"
            size="lg"
            onClick={() => void onDeleteRoom()}
            disabled={busy || state.status === "finished"}
            aria-label="حذف اتاق"
          >
            <Trash2 className="size-5" />
          </Button>
        ) : null}

        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="flex-1 min-w-[140px] rounded-2xl shadow-none"
          onClick={() => void onOpenShareDialog()}
          disabled={busy || !canInvite}
        >
          <Share2 className="size-5" />
          اشتراک‌ گذاری
        </Button>

        {!isHost && onLeaveRoom ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="rounded-2xl border-border/80 shadow-none"
            onClick={() => void onLeaveRoom()}
            disabled={busy || state.status === "finished"}
            aria-label="خروج از اتاق"
          >
            <LogOut className="size-5" />
          </Button>
        ) : null}
        {isHost ? (
          <Button
            type="button"
            variant="default"
            size="lg"
            className="flex-[1.25] min-w-[160px] rounded-2xl shadow-[0_12px_32px_rgba(25,28,29,0.06)] disabled:opacity-45"
            onClick={() => void onStartGame()}
            disabled={!canStart || busy || state.status === "finished"}
          >
            شروع بازی
            <Play className="size-5" aria-hidden />
          </Button>
        ) : null}
      </div>
    </section>
  );
}
