"use client";

import { RoomCard } from "@/components/rooms/RoomCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRoomsListQuery } from "@/hooks/api-queries";
import { useSyncErrorToToast } from "@/hooks/use-sync-error-toast";
import { cn } from "@/lib/utils";
import { LucideTrophy, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

function formatFaInt(n: number) {
  return n.toLocaleString("fa-IR", { useGrouping: false });
}

type FilterChip = "all" | "waiting" | "playing";

const FILTER_OPTIONS = [
  ["all", "همه"],
  ["waiting", "در انتظار"],
  ["playing", "در حال بازی"],
] as const;

function FilterChipRow({
  filter,
  onFilterChange,
  className,
}: {
  filter: FilterChip;
  onFilterChange: (v: FilterChip) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-2", className)}>
      {FILTER_OPTIONS.map(([key, label]) => (
        <Button
          key={key}
          type="button"
          variant={filter === key ? "secondary" : "outline"}
          size="sm"
          onClick={() => onFilterChange(key)}
          className="shrink-0 rounded-full border-border/30 font-bold shadow-sm"
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

export function RoomListClient() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterChip>("all");
  const roomsQuery = useRoomsListQuery();
  const rooms = roomsQuery.data?.rooms;
  const loading = roomsQuery.isLoading;
  const error =
    roomsQuery.error instanceof Error ? roomsQuery.error.message : null;

  useSyncErrorToToast(error);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rooms ?? []).filter((r) => {
      if (filter === "waiting" && r.status !== "waiting") return false;
      if (filter === "playing" && r.status !== "playing") return false;
      if (!q) return true;
      const hay = [
        r.roomCode,
        r.title,
        r.hostLabel,
        ...r.players.map((p) => p.displayName),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rooms, query, filter]);

  const onlineLabel = formatFaInt((rooms ?? []).length);

  return (
    <div className="text-foreground">
      <main className="mx-auto max-w-4xl px-2 pt-1 sm:px-4">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="sr-only">اتاق‌ها</h1>
            <p className="mb-2 font-medium text-muted-foreground">
              {loading && (rooms ?? []).length === 0
                ? "در حال بارگذاری…"
                : `${onlineLabel} روم آنلاین در حال بازی یا انتظار`}
            </p>
            <FilterChipRow
              filter={filter}
              onFilterChange={setFilter}
              className="mt-4 overflow-x-auto pb-1 md:hidden"
            />
          </div>
          <FilterChipRow
            filter={filter}
            onFilterChange={setFilter}
            className="hidden md:flex"
          />
        </div>

        <div className="relative mb-10">
          <div className="pointer-events-none absolute inset-y-0 right-4 z-10 flex items-center">
            <Search className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی نام روم، کد یا بازیکن…"
            className="rounded-2xl border-0 bg-card pr-12 ps-6 text-base font-medium shadow-[0_8px_20px_rgba(0,0,0,0.03)] placeholder:text-muted-foreground/70 focus-visible:ring-primary/20 sm:text-lg"
            autoComplete="off"
          />
        </div>

        {error ? (
          <Alert
            variant="destructive"
            className="mb-6 border-destructive/30 bg-destructive/10 text-destructive *:data-[slot=alert-description]:text-destructive"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filtered.map((room) => (
            <RoomCard key={room.roomCode} room={room} />
          ))}
        </div>

        {!loading && filtered.length === 0 ? (
          <p className="mt-10 text-center font-medium text-muted-foreground">
            {(rooms ?? []).length === 0
              ? "هنوز روم عمومی فعالی نیست. اولین نفر باشید!"
              : "رومی با این فیلتر پیدا نشد."}
          </p>
        ) : null}

        <section className="group relative mt-12 mb-20 overflow-hidden rounded-xl bg-linear-to-br from-primary to-primary/70 p-8">
          <div className="relative z-10 max-w-xs text-white">
            <h2 className="mb-3 text-2xl font-black ">تورنمنت هفتگی</h2>
            <p className="mb-6  font-medium leading-relaxed text-primary-foreground/90 opacity-90">
              به رقابت بزرگ «اسم‌وفامیل» بپیوندید و شانس برنده شدن ۵۰۰۰ سکه
              طلایی را داشته باشید!
            </p>
            <Button
              type="button"
              variant="secondary"
              className="bg-yellow-400 text-foreground px-5 text-md font-bold shadow-xl shadow-black/10 hover:scale-105 hover:bg-yellow-300 active:scale-100"
            >
              ثبت‌نام در چالش
            </Button>
          </div>
          <div className="pointer-events-none absolute -left-10 -bottom-10 opacity-20 transition-transform duration-700 group-hover:scale-110 motion-reduce:transition-none">
            <LucideTrophy
              className="size-48 rotate-20   text-white/50"
              strokeWidth={1}
              aria-hidden
            />
          </div>
        </section>
      </main>

      <div className="fixed inset-e-6 bottom-24 z-40 sm:inset-e-10">
        <Button
          render={<Link href="/create" />}
          nativeButton={false}
          size="lg"
          className="h-auto gap-3 px-6 py-5 text-lg shadow-2xl border-white hover:scale-105 active:scale-95"
        >
          <Plus className="size-6 stroke-[2.5]" aria-hidden />
          ساخت روم جدید
        </Button>
      </div>
    </div>
  );
}
