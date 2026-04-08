import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Copy, Play, QrCode, Share2, UserPlus, X } from "lucide-react";
import type { RoomState } from "./types";

type LobbyRoomSectionProps = {
  state: RoomState;
  isHost: boolean;
  canStart: boolean;
  busy: boolean;
  copiedInvite: boolean;
  qrDataUrl: string | null;
  showQr: boolean;
  onOpenQr: () => void;
  onCloseQr: () => void;
  onShareInvite: () => void;
  onCopyInviteLink: () => void;
  onStartGame: () => void;
};

export function LobbyRoomSection({
  state,
  isHost,
  canStart,
  busy,
  copiedInvite,
  qrDataUrl,
  showQr,
  onOpenQr,
  onCloseQr,
  onShareInvite,
  onCopyInviteLink,
  onStartGame,
}: LobbyRoomSectionProps) {
  const roomTitle = state.title.trim() || `اتاق ${state.roomCode}`;
  return (
    <section className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ka-primary/70">
          اتاق انتظار
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h2
            className="text-4xl font-black tracking-tighter text-ka-on-background md:text-5xl"
          >
            {roomTitle}
          </h2>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="flex-1 min-w-[140px] rounded-2xl shadow-none"
          onClick={() => void onOpenQr()}
          disabled={busy}
        >
          <QrCode className="size-5" />
          QR دعوت
        </Button>
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
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="rounded-2xl border-0 bg-ka-surface-container-highest text-ka-on-primary-fixed-variant shadow-none hover:bg-ka-primary-fixed"
          onClick={() => void onShareInvite()}
          disabled={busy}
        >
          <Share2 className="size-5" />
          اشتراک‌گذاری
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

      {showQr ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-xs rounded-2xl bg-white p-4 text-center shadow-xl dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold text-ka-on-surface">QR دعوت</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => void onCloseQr()}
                aria-label="بستن"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="mx-auto grid size-56 place-items-center rounded-xl border border-dashed border-ka-primary/20 bg-white p-2">
              {qrDataUrl ? (
                <Image
                  src={qrDataUrl}
                  alt={`کد QR اتاق ${state.roomCode}`}
                  width={220}
                  height={220}
                  unoptimized
                  className="rounded-md"
                />
              ) : (
                <span className="text-sm text-ka-on-surface-variant">در حال آماده‌سازی...</span>
              )}
            </div>
            <p className="mt-3 text-xs text-ka-on-surface-variant">
              لینک ورود با کد {state.roomCode}
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => void onCopyInviteLink()}
              >
                <Copy className="size-4" />
                کپی لینک
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => void onShareInvite()}
              >
                <Share2 className="size-4" />
                اشتراک
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
