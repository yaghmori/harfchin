import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { UserMinus } from "lucide-react";
import type { KeyboardEvent } from "react";
import { PlayerAvatar } from "./PlayerAvatar";
import type { Player, RoomState } from "./types";

type LobbyPlayersGridProps = {
  state: RoomState;
  hostPlayer: Player | undefined;
  otherPlayers: Player[];
  emptySlots: number;
  /** Only empty capacity slots trigger this (not filled player cards). */
  onEmptySlotInvite: () => void;
  /** When set (host + waiting), each non-host player card shows remove → opens confirm in parent. */
  onRequestKick?: (player: Pick<Player, "userId" | "displayName">) => void;
};

export function LobbyPlayersGrid({
  state,
  hostPlayer,
  otherPlayers,
  emptySlots,
  onEmptySlotInvite,
  onRequestKick,
}: LobbyPlayersGridProps) {
  const inviteInteractive = state.status !== "finished" && emptySlots > 0;
  const showKick = Boolean(onRequestKick);

  function emptySlotKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEmptySlotInvite();
    }
  }

  return (
    <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
      {hostPlayer ? (
        <Card className="col-span-2 flex flex-row items-center justify-between border-primary/15 py-5 shadow-[0_12px_32px_rgba(25,28,29,0.06)]">
          <CardContent className="flex flex-1 items-center gap-5 p-0 px-5">
            <div className="relative shrink-0">
              <PlayerAvatar
                name={hostPlayer.displayName}
                size="lg"
                dimmed={!hostPlayer.isReady}
              />
              <div className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-white bg-secondary">
                <span className="text-[10px] font-black text-secondary-foreground">
                  ★
                </span>
              </div>
            </div>
            <div className="min-w-0 text-start">
              <h3 className="truncate text-lg font-black">
                {hostPlayer.displayName}
                {hostPlayer.userId === state.meUserId ? " (شما)" : ""}
              </h3>
              <p className="text-xs font-bold text-primary">میزبان اتاق</p>
            </div>
          </CardContent>
          <div className="px-4">
            <Badge
              className={cn(
                "rounded-full px-3 py-1 text-[10px] font-black",
                hostPlayer.isReady
                  ? "border-0 bg-primary/15 text-primary"
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
          className="relative border-transparent py-5 text-center shadow-[0_12px_32px_rgba(25,28,29,0.04)] transition-colors hover:border-primary/20"
        >
          {showKick ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-2 end-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label={`حذف ${p.displayName} از اتاق`}
              onClick={() => onRequestKick?.(p)}
            >
              <UserMinus className="size-4" aria-hidden />
            </Button>
          ) : null}
          <CardContent className="flex flex-col items-center gap-3 p-0 px-3">
            <PlayerAvatar name={p.displayName} dimmed={!p.isReady} />
            <span
              className={cn("text-sm font-bold", !p.isReady && "opacity-50")}
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

      {Array.from({ length: emptySlots }).map((_, i) =>
        inviteInteractive ? (
          <button
            key={`empty-${i}`}
            type="button"
            onClick={() => onEmptySlotInvite()}
            onKeyDown={emptySlotKeyDown}
            aria-label="دعوت دوستان برای پر کردن این جای خالی"
            className={cn(
              "flex min-h-[140px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed bg-muted border-border  p-5 text-muted-foreground",
              "cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            <span className="text-4xl text-muted-foreground/50">+</span>
            <span className="text-xs  text-muted-foreground/50 font-bold">
              ظرفیت خالی
            </span>
          </button>
        ) : (
          <div
            key={`empty-${i}`}
            className="flex min-h-[140px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-border bg-muted p-5 text-muted-foreground"
          >
            <span className="text-xl text-muted-foreground/50">+</span>
            <span className="text-xs text-muted-foreground/50 font-bold">
              ظرفیت خالی
            </span>
          </div>
        ),
      )}
    </section>
  );
}
