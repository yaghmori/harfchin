"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useFriendsDiscoverQuery,
  useFriendsNetworkQuery,
  useRoomInviteInboxQuery,
} from "@/hooks/api-queries";
import {
  useBlockUserMutation,
  useFriendRequestMutation,
  useFriendRespondMutation,
  useRoomInviteRespondMutation,
  useUnfriendMutation,
} from "@/hooks/api-mutations";
import { Search, UserPlus, X, ShieldBan, Check } from "lucide-react";
import { useMemo, useState } from "react";

type TabKey = "friends" | "requests" | "discover";

export function FriendsHubClient() {
  const [tab, setTab] = useState<TabKey>("friends");
  const [q, setQ] = useState("");

  const networkQuery = useFriendsNetworkQuery();
  const discoverQuery = useFriendsDiscoverQuery(q);
  const invitesQuery = useRoomInviteInboxQuery();

  const requestMutation = useFriendRequestMutation();
  const respondFriendMutation = useFriendRespondMutation();
  const unfriendMutation = useUnfriendMutation();
  const blockMutation = useBlockUserMutation();
  const inviteRespondMutation = useRoomInviteRespondMutation();

  const incomingCount = networkQuery.data?.incomingRequests.length ?? 0;
  const tabs = useMemo(
    () =>
      [
        { key: "friends", label: "دوستان من" },
        { key: "requests", label: `درخواست‌ها ${incomingCount ? `(${incomingCount})` : ""}` },
        { key: "discover", label: "یافتن همراهان" },
      ] as { key: TabKey; label: string }[],
    [incomingCount],
  );

  return (
    <div className="space-y-4">
      <header className="space-y-1 text-start">
        <h1 className="sr-only">دوستان</h1>
        <p className="text-sm text-muted-foreground">مدیریت ارتباطات و دعوت بازیکنان</p>
      </header>

      <div className="grid grid-cols-3 rounded-full bg-muted p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-2 text-xs font-bold ${tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "friends" ? (
        <section className="space-y-3">
          {(networkQuery.data?.friends ?? []).map((f) => (
            <div key={f.userId} className="flex items-center justify-between rounded-2xl bg-card p-3 shadow-sm">
              <div className="text-start">
                <p className="font-bold">{f.name}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => unfriendMutation.mutate(f.userId)}
                >
                  حذف
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => blockMutation.mutate(f.userId)}
                >
                  <ShieldBan className="size-4" />
                  مسدود
                </Button>
              </div>
            </div>
          ))}
          {networkQuery.data && networkQuery.data.friends.length === 0 ? (
            <p className="rounded-xl bg-muted px-3 py-4 text-center text-sm text-muted-foreground">
              هنوز دوستی ثبت نشده است.
            </p>
          ) : null}
        </section>
      ) : null}

      {tab === "requests" ? (
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-sm font-black text-primary">درخواست‌های دوستی</h2>
            {(networkQuery.data?.incomingRequests ?? []).map((r) => (
              <div key={r.friendshipId} className="flex items-center justify-between rounded-2xl bg-card p-3 shadow-sm">
                <p className="font-bold">{r.displayName}</p>
                <div className="flex gap-2">
                  <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={() =>
                      respondFriendMutation.mutate({
                        friendshipId: r.friendshipId,
                        action: "decline",
                      })
                    }
                  >
                    <X className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    onClick={() =>
                      respondFriendMutation.mutate({
                        friendshipId: r.friendshipId,
                        action: "accept",
                      })
                    }
                  >
                    <Check className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-black text-primary">دعوت به بازی</h2>
            {(invitesQuery.data?.items ?? []).map((inv) => (
              <div key={inv.inviteId} className="rounded-2xl bg-card p-3 shadow-sm">
                <p className="font-bold">{inv.roomTitle}</p>
                <p className="mt-1 text-xs text-muted-foreground">دعوت‌کننده: {inv.inviterName}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      inviteRespondMutation.mutate({
                        inviteId: inv.inviteId,
                        action: "decline",
                      })
                    }
                  >
                    رد
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      inviteRespondMutation.mutate({
                        inviteId: inv.inviteId,
                        action: "accept",
                      })
                    }
                    disabled={inv.roomStatus !== "waiting"}
                  >
                    پذیرش
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "discover" ? (
        <section className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="نام یا ایمیل را جستجو کنید"
              className="pl-9"
            />
          </div>
          {(discoverQuery.data?.items ?? []).map((u) => (
            <div key={u.userId} className="flex items-center justify-between rounded-2xl bg-card p-3 shadow-sm">
              <div className="text-start">
                <p className="font-bold">{u.displayName}</p>
                {u.handle ? (
                  <p className="text-xs text-muted-foreground">{u.handle}</p>
                ) : null}
              </div>
              {u.relationStatus === "none" ? (
                <Button size="sm" onClick={() => requestMutation.mutate(u.userId)}>
                  <UserPlus className="size-4" />
                  درخواست
                </Button>
              ) : (
                <span className="text-xs font-bold text-muted-foreground">
                  {u.relationStatus === "friend"
                    ? "دوست"
                    : u.relationStatus === "incoming"
                      ? "درخواست ورودی"
                      : "درخواست ارسال‌شده"}
                </span>
              )}
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
