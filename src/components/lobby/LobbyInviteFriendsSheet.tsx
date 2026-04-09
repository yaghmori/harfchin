"use client";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

type FriendItem = {
  userId: string;
  displayName: string;
  inRoom: boolean;
  canInvite: boolean;
};

type LobbyInviteFriendsSheetProps = {
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
  roomIsPrivate: boolean;
  canInvite: boolean;
  items: FriendItem[];
  inviteBusy: boolean;
  onInvite: (friendUserId: string) => Promise<void>;
};

export function LobbyInviteFriendsSheet({
  open,
  onOpenChange,
  roomIsPrivate,
  canInvite,
  items,
  inviteBusy,
  onInvite,
}: LobbyInviteFriendsSheetProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((f) => f.displayName.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} size="md">
      <ResponsiveDialog.Header className="pb-2">
        <ResponsiveDialog.Title className="text-base font-black">
          دعوت سریع دوستان
        </ResponsiveDialog.Title>
      </ResponsiveDialog.Header>

      <ResponsiveDialog.Content className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی دوستان..."
            className="pr-3 pl-9"
          />
        </div>

        {!canInvite ? (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            {roomIsPrivate
              ? "در اتاق خصوصی فقط میزبان می‌تواند دعوت یا اشتراک‌گذاری انجام دهد."
              : "در این اتاق اجازه دعوت ندارید."}
          </p>
        ) : null}

        <div className="max-h-[min(58dvh,520px)] min-h-[20dvh] space-y-2 overflow-y-auto">
          {filtered.map((f) => (
            <div
              key={f.userId}
              className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2"
            >
              <div className="min-w-0 flex-1 text-start">
                <p className="truncate text-sm font-semibold">{f.displayName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {f.inRoom ? "در اتاق حضور دارد" : "خارج از اتاق"}
                </p>
              </div>
              <Button
                type="button"
                size="default"
                className="shrink-0 rounded-full px-5"
                disabled={!f.canInvite || inviteBusy}
                onClick={() => void onInvite(f.userId)}
              >
                دعوت
              </Button>
            </div>
          ))}

          {filtered.length === 0 ? (
            <p className="px-1 py-6 text-center text-xs text-muted-foreground">
              دوستی یافت نشد.
            </p>
          ) : null}
        </div>
      </ResponsiveDialog.Content>
    </ResponsiveDialog>
  );
}
