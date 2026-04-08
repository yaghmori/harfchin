import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { RoomState } from "./types";

type LobbyFinishedAlertProps = {
  state: RoomState;
  isHost: boolean;
  busy: boolean;
  onReplay: () => void;
};

export function LobbyFinishedAlert({
  state,
  isHost,
  busy,
  onReplay,
}: LobbyFinishedAlertProps) {
  if (state.status !== "finished" || !state.lastFinishedGameId) return null;

  return (
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
            onClick={() => void onReplay()}
            className="w-full rounded-2xl"
          >
            بازی دوباره
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
