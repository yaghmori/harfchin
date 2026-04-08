import { Button } from "@/components/ui/button";
import { Copy, Play, UserPlus } from "lucide-react";
import type { RoomState } from "./types";

type LobbyRoomSectionProps = {
  state: RoomState;
  isHost: boolean;
  canStart: boolean;
  busy: boolean;
  copiedCode: boolean;
  copiedInvite: boolean;
  onCopyRoomCode: () => void;
  onCopyInviteLink: () => void;
  onStartGame: () => void;
};

export function LobbyRoomSection({
  state,
  isHost,
  canStart,
  busy,
  copiedCode,
  copiedInvite,
  onCopyRoomCode,
  onCopyInviteLink,
  onStartGame,
}: LobbyRoomSectionProps) {
  return (
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
            onClick={() => void onCopyRoomCode()}
            aria-label="کپی کد اتاق"
          >
            <Copy className="size-5 text-ka-primary" />
          </Button>
          {copiedCode ? (
            <span className="text-xs font-bold text-green-600">کپی شد</span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1 rounded-2xl border-0 bg-ka-surface-container-highest text-ka-on-primary-fixed-variant shadow-none hover:bg-ka-primary-fixed min-w-[140px]"
          onClick={() => void onCopyInviteLink()}
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
