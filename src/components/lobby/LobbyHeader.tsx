import { Button } from "@/components/ui/button";
import { faDigits } from "@/lib/format";
import { Coins, LogOut } from "lucide-react";
import { playerInitials } from "./PlayerAvatar";

type LobbyHeaderProps = {
  displayTitle: string;
  meDisplayName: string | null;
  busy: boolean;
  onLeave: () => void;
};

export function LobbyHeader({
  displayTitle,
  meDisplayName,
  busy,
  onLeave,
}: LobbyHeaderProps) {
  return (
    <header className="mb-4 flex w-full items-center justify-between rounded-2xl border border-ka-outline-variant/30 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-md md:px-5 dark:border-zinc-700 dark:bg-zinc-900/80">
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
          onClick={() => void onLeave()}
          disabled={busy}
          aria-label="ترک اتاق"
        >
          <LogOut className="size-4" />
        </Button>
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ka-surface-container-high ring-2 ring-ka-primary/10">
          <span className="text-sm font-black text-ka-primary">
            {meDisplayName ? playerInitials(meDisplayName) : "?"}
          </span>
        </div>
      </div>
    </header>
  );
}
