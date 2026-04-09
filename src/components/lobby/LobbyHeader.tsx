import { Button } from "@/components/ui/button";
import { faDigits } from "@/lib/format";
import { Coins, LogOut, Trash2 } from "lucide-react";
import { playerInitials } from "./PlayerAvatar";

type LobbyHeaderProps = {
  displayTitle: string;
  meDisplayName: string | null;
  isHost: boolean;
  busy: boolean;
  onLeave: () => void;
  onDeleteRoom: () => void;
};

export function LobbyHeader({
  displayTitle,
  meDisplayName,
  isHost,
  busy,
  onLeave,
  onDeleteRoom,
}: LobbyHeaderProps) {
  return (
    <header className="mb-4 flex w-full items-center justify-between rounded-2xl border border-border/40 bg-card/90 px-4 py-3 shadow-sm backdrop-blur-md md:px-5 dark:border-zinc-700 dark:bg-zinc-900/80">
      <div className="flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/60 px-3 py-1.5">
        <Coins className="size-4 shrink-0 text-primary" aria-hidden />
        <span className="text-xs font-bold text-primary">
          {faDigits(0)} سکه
        </span>
      </div>
      <h1 className="truncate text-center text-lg font-black tracking-tight text-primary md:text-xl">
        {displayTitle}
      </h1>
      <div className="flex items-center gap-2">
        {isHost ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => void onDeleteRoom()}
            disabled={busy}
            aria-label="حذف اتاق"
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => void onLeave()}
          disabled={busy}
          aria-label="ترک اتاق"
        >
          <LogOut className="size-4" />
        </Button>
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-primary/10">
          <span className="text-sm font-black text-primary">
            {meDisplayName ? playerInitials(meDisplayName) : "?"}
          </span>
        </div>
      </div>
    </header>
  );
}
