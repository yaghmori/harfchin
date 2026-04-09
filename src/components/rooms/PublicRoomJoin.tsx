"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiGet } from "@/features/api/client";
import { API_ENDPOINTS } from "@/features/api/endpoints";
import { useJoinRoomMutation } from "@/hooks/api-mutations";
import type { AuthMePayload } from "@/hooks/api-queries";
import { MAX_DISPLAY_NAME_LENGTH } from "@/lib/constants";
import type { DirectoryRoom } from "@/lib/room-directory";
import { cn } from "@/lib/utils";
import { ChevronLeft, Users, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export function JoinRoomNameDialog({
  open,
  onOpenChange,
  roomCode,
  busy,
  onJoin,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomCode: string;
  busy: boolean;
  onJoin: (displayName: string) => Promise<void>;
}) {
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = name.trim();
    if (!t || busy) return;
    await onJoin(t);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" showCloseButton={!busy}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>ورود به اتاق</DialogTitle>
            <DialogDescription>
              نام خود را برای نمایش در لابی وارد کنید.
              {roomCode ? (
                <>
                  {" "}
                  <span className="font-mono font-bold" dir="ltr">
                    {roomCode}
                  </span>
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="join-guest-name">نام نمایشی</Label>
            <Input
              id="join-guest-name"
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="nickname"
              placeholder="مثلاً علی"
              disabled={busy}
              className="text-center"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="submit" disabled={busy || !name.trim()} className="w-full sm:w-auto">
              {busy ? "در حال ورود…" : "ورود به لابی"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formatFaInt(n: number) {
  return n.toLocaleString("fa-IR", { useGrouping: false });
}

export function PublicRoomJoinButton({
  roomCode,
  disabled,
  className,
  size = "default",
  children,
}: {
  roomCode: string;
  disabled?: boolean;
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const joinMutation = useJoinRoomMutation();
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const busy = joinMutation.isPending;

  const runJoin = useCallback(
    async (displayName?: string) => {
      try {
        const data = await joinMutation.mutateAsync({
          roomCode,
          ...(displayName ? { displayName } : {}),
        });
        toast.success("به اتاق پیوستید.");
        router.push(`/lobby/${data.roomCode}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "خطا");
      } finally {
        joinMutation.reset();
      }
    },
    [joinMutation, roomCode, router],
  );

  const handleClick = useCallback(async () => {
    if (disabled || busy) return;
    try {
      const { user } = await apiGet<AuthMePayload>(API_ENDPOINTS.auth.me);
      if (user?.isRegistered && user.name?.trim()) {
        await runJoin();
        return;
      }
      setNameDialogOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا");
    }
  }, [disabled, busy, runJoin]);

  return (
    <>
      <Button
        type="button"
        disabled={disabled || busy}
        onClick={handleClick}
        className={className}
        size={size}
      >
        {children}
      </Button>
      <JoinRoomNameDialog
        open={nameDialogOpen}
        onOpenChange={setNameDialogOpen}
        roomCode={roomCode}
        busy={busy}
        onJoin={async (displayName) => {
          setNameDialogOpen(false);
          await runJoin(displayName);
        }}
      />
    </>
  );
}

export function PublicRoomJoinHomeRow({
  room,
  iconVariant,
}: {
  room: DirectoryRoom;
  /** Alternating row icons — must be serializable from Server Components. */
  iconVariant: "users" | "zap";
}) {
  const Icon = iconVariant === "users" ? Users : Zap;
  const router = useRouter();
  const joinMutation = useJoinRoomMutation();
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const busy = joinMutation.isPending;
  const playing = room.status === "playing";
  const canJoin = room.status === "waiting" && room.playerCount < room.maxPlayers;

  const runJoin = useCallback(
    async (displayName?: string) => {
      try {
        const data = await joinMutation.mutateAsync({
          roomCode: room.roomCode,
          ...(displayName ? { displayName } : {}),
        });
        toast.success("به اتاق پیوستید.");
        router.push(`/lobby/${data.roomCode}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "خطا");
      } finally {
        joinMutation.reset();
      }
    },
    [joinMutation, room.roomCode, router],
  );

  const handleActivate = useCallback(async () => {
    if (!canJoin || busy) return;
    try {
      const { user } = await apiGet<AuthMePayload>(API_ENDPOINTS.auth.me);
      if (user?.isRegistered && user.name?.trim()) {
        await runJoin();
        return;
      }
      setNameDialogOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا");
    }
  }, [busy, canJoin, runJoin]);

  const rowClass = cn(
    "flex w-full items-center gap-3 rounded-2xl p-4 text-start transition-colors",
    canJoin
      ? "cursor-pointer bg-muted/80 hover:bg-muted dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
      : "cursor-default bg-muted/50 opacity-90 dark:bg-zinc-800/40",
  );

  return (
    <>
      <li>
        <button type="button" className={rowClass} onClick={handleActivate} disabled={!canJoin || busy}>
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-card shadow-sm dark:bg-zinc-900">
            <Icon
              className="size-5 text-[#7E3AF2] dark:text-violet-400"
              aria-hidden
            />
          </span>
          <div className="min-w-0 flex-1 text-start">
            <p className="font-bold text-foreground">{room.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {playing ? "در حال بازی" : "در انتظار بازیکن"}
              {" · "}
              میزبان {room.hostLabel}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-muted-foreground">
            {formatFaInt(room.playerCount)}/{formatFaInt(room.maxPlayers)} بازیکن
            {canJoin ? (
              <ChevronLeft className="size-5 text-[#7E3AF2] opacity-80" aria-hidden />
            ) : null}
          </span>
        </button>
      </li>
      <JoinRoomNameDialog
        open={nameDialogOpen}
        onOpenChange={setNameDialogOpen}
        roomCode={room.roomCode}
        busy={busy}
        onJoin={async (displayName) => {
          setNameDialogOpen(false);
          await runJoin(displayName);
        }}
      />
    </>
  );
}
