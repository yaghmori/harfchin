import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "./PlayerAvatar";
import type { Player, RoomState } from "./types";

type LobbyPlayersGridProps = {
  state: RoomState;
  hostPlayer: Player | undefined;
  otherPlayers: Player[];
  emptySlots: number;
  onCopyInviteLink: () => void;
};

export function LobbyPlayersGrid({
  state,
  hostPlayer,
  otherPlayers,
  emptySlots,
  onCopyInviteLink,
}: LobbyPlayersGridProps) {
  return (
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
            <PlayerAvatar name={p.displayName} dimmed={!p.isReady} />
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
          onClick={() => void onCopyInviteLink()}
        >
          <span className="text-2xl text-ka-outline-variant">+</span>
          <span className="text-[10px] font-bold">ظرفیت خالی</span>
        </button>
      ))}
    </section>
  );
}
