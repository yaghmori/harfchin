"use client";

import { PublicRoomJoinButton } from "@/components/rooms/PublicRoomJoin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DirectoryRoom } from "@/lib/room-directory";
import { cn } from "@/lib/utils";

function formatFaInt(n: number) {
  return n.toLocaleString("fa-IR", { useGrouping: false });
}

function firstGrapheme(s: string) {
  const g = Array.from(s.trim())[0];
  return g ?? "?";
}

function avatarHue(name: string) {
  const hues = [265, 200, 35, 310, 145, 190];
  let s = 0;
  for (let i = 0; i < name.length; i++) s += name.charCodeAt(i);
  return hues[s % hues.length];
}

function difficultyMeta(room: DirectoryRoom) {
  const { draftRoundTimeSec, draftTotalRounds } = room;
  if (draftRoundTimeSec <= 45 || draftTotalRounds >= 12) {
    return { dotClass: "bg-destructive", label: "خیلی سخت" as const };
  }
  if (draftRoundTimeSec <= 75 || draftTotalRounds >= 8) {
    return { dotClass: "bg-secondary", label: "سخت" as const };
  }
  return { dotClass: "bg-muted-foreground/40", label: "معمولی" as const };
}

function roomSubtitle(room: DirectoryRoom) {
  const d = difficultyMeta(room);
  return `${d.label} • ${formatFaInt(room.draftTotalRounds)} دور • زمان ${formatFaInt(room.draftRoundTimeSec)} ثانیه`;
}

export function RoomCard({ room }: { room: DirectoryRoom }) {
  const playing = room.status === "playing";
  const full = room.playerCount >= room.maxPlayers;
  const canEnter = room.status === "waiting" && !full;
  const diff = difficultyMeta(room);
  const shown = room.players.slice(0, 3);
  const extra = Math.max(0, room.playerCount - shown.length);

  return (
    <Card
      className={cn(
        "group/card border-transparent bg-card p-6 shadow-[0_12px_32px_rgba(25,28,29,0.04)] transition-all duration-300",
        "hover:border-primary/10 hover:shadow-md",
        "gap-6 shadow-none",
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-0">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-xl text-foreground">
            {room.title}
          </CardTitle>
          <CardDescription className="flex items-center gap-2 font-medium text-muted-foreground">
            <span
              className={cn("h-2 w-2 shrink-0 rounded-full", diff.dotClass)}
            />
            <span>{roomSubtitle(room)}</span>
          </CardDescription>
        </div>
        {playing ? (
          <Badge
            variant="secondary"
            className="shrink-0 rounded-xl border-0 bg-primary/15 px-3 py-1.5 text-xs font-bold tracking-widest text-primary shadow-none"
          >
            LIVE
          </Badge>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-row items-center justify-between gap-3 p-0">
        <div className="flex -space-x-2 space-x-reverse">
          {shown.map((p) => {
            const h = avatarHue(p.displayName);
            return (
              <div
                key={p.displayName}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card text-[10px] font-bold text-white"
                style={{ backgroundColor: `hsl(${h} 52% 42%)` }}
                title={p.displayName}
              >
                {firstGrapheme(p.displayName)}
              </div>
            );
          })}
          {extra > 0 ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-bold text-foreground">
              +{formatFaInt(extra)}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="font-bold text-muted-foreground">
            {formatFaInt(room.playerCount)}/{formatFaInt(room.maxPlayers)}{" "}
            بازیکن
          </span>
          {canEnter ? (
            <PublicRoomJoinButton
              roomCode={room.roomCode}
              size="sm"
              className="shadow-lg shadow-primary/20 group-hover/card:scale-105 active:scale-95"
            >
              ورود
            </PublicRoomJoinButton>
          ) : playing ? (
            <Button
              type="button"
              variant="outline"
              disabled
              className="cursor-not-allowed font-bold text-foreground/60 opacity-100"
            >
              در حال بازی
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled
              className="cursor-not-allowed font-bold text-foreground/50 opacity-100"
            >
              پر
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
