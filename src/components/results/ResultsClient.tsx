"use client";

import { CategoryPlayerTabs } from "@/components/game/CategoryPlayerTabs";
import { pickAnswerForCategory } from "@/components/game/round-answer-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoomReplayMutation } from "@/hooks/api-mutations";
import { useResultsByGameIdQuery } from "@/hooks/api-queries";
import { useSyncErrorToToast } from "@/hooks/use-sync-error-toast";
import { faDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  Apple,
  BarChart3,
  Briefcase,
  Building2,
  Car,
  Flower2,
  Home,
  MapPin,
  Palette,
  PartyPopper,
  PawPrint,
  PenLine,
  Play,
  Sparkles,
  Star,
  Trophy,
  User,
  Users,
  Utensils,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

function categoryIcon(key: string): LucideIcon {
  const map: Record<string, LucideIcon> = {
    first_name: User,
    last_name: Users,
    city: MapPin,
    country: Building2,
    food: Utensils,
    animal: PawPrint,
    fruit: Apple,
    body_parts: User,
    objects: Sparkles,
    occupation: Briefcase,
    vehicle: Car,
    color: Palette,
    flower_plant: Flower2,
  };
  return map[key] ?? PenLine;
}

export function ResultsClient({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [localError, setLocalError] = useState<string | null>(null);
  const [roundIdx, setRoundIdx] = useState(0);
  const resultsQuery = useResultsByGameIdQuery(gameId);
  const replayMutation = useRoomReplayMutation();
  const data = resultsQuery.data ?? null;
  const busy = replayMutation.isPending;
  const error =
    localError ??
    (resultsQuery.error instanceof Error ? resultsQuery.error.message : null);

  useSyncErrorToToast(error);

  async function replay() {
    if (!data) return;
    if (data.hostUserId !== data.meUserId) return;
    try {
      await replayMutation.mutateAsync({ roomCode: data.roomCode });
      toast.success("بازگشت به لابی برای بازی دوباره.");
      router.push(`/lobby/${data.roomCode}`);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "خطا");
    }
  }

  if (error && !data) {
    return (
      <div className="flex min-h-dvh flex-col bg-background px-5 py-10 text-foreground">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          variant="link"
          className="mt-4 h-auto px-0"
        >
          خانه
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-5 text-muted-foreground">
        <p className="font-medium">در حال بارگذاری نتایج…</p>
      </div>
    );
  }

  const isHost = data.hostUserId === data.meUserId;
  const winner = data.leaderboard[0];
  const winnerPlayer = winner
    ? (data.players.find((p) => p.id === winner.roomPlayerId) ?? null)
    : null;

  const roundsSummary = data.roundsSummary ?? [];
  const rsLen = roundsSummary.length;
  const safeRoundIdx = rsLen ? Math.min(roundIdx, rsLen - 1) : 0;
  const activeRound = rsLen ? roundsSummary[safeRoundIdx] : null;
  const activeRoundPlayers = activeRound?.players ?? data.players;

  function isDuplicateForActiveRound(
    catKey: string,
    normalized: string,
    isValid: boolean,
  ) {
    if (!isValid || !normalized) return false;
    const vals = activeRoundPlayers
      .map((p) => {
        const a = pickAnswerForCategory(
          p.answers as unknown as Record<string, unknown>[],
          catKey,
        );
        return a?.isValid ? a.normalizedValue : "";
      })
      .filter(Boolean);
    return vals.filter((v) => v === normalized).length > 1;
  }

  const answersByKey = new Map(
    (winnerPlayer?.answers ?? []).map((a) => [a.categoryKey, a]),
  );

  const roundRows = data.categories.map((c) => {
    const a = answersByKey.get(c.key);
    return {
      key: c.key,
      title: c.title,
      value: a?.value ?? "—",
      score: a?.score ?? 0,
      Icon: categoryIcon(c.key),
    };
  });

  const roundTotal = roundRows.reduce((s, r) => s + r.score, 0);

  const winnerTotal = winner?.totalScore ?? 0;
  const levelDen = Math.max(
    1,
    data.categories.length * 12 * Math.max(1, data.game.totalRounds),
  );
  const levelPct = Math.min(100, Math.round((winnerTotal / levelDen) * 100));

  const mePlayer =
    data.meRoomPlayerId == null
      ? null
      : (data.players.find((p) => p.id === data.meRoomPlayerId) ?? null);
  const displayInitial = mePlayer?.displayName?.trim().slice(0, 1) ?? "؟";
  const myTotal =
    data.leaderboard.find((l) => l.roomPlayerId === data.meRoomPlayerId)
      ?.totalScore ?? 0;

  return (
    <div className="flex flex-col bg-background pb-6 text-foreground">
      <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-white/80 px-4 py-3 dark:bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading text-lg font-black text-primary"
            aria-hidden
          >
            {displayInitial}
          </div>
          <span className="text-sm font-bold text-muted-foreground">
            امتیاز شما
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 font-heading text-sm font-semibold text-secondary-foreground">
          <span>{faDigits(myTotal)} امتیاز</span>
          <Star className="size-4 fill-amber-600 text-amber-700" aria-hidden />
        </div>
      </div>

      <main className="mx-auto w-full max-w-lg flex-1 space-y-6 px-1 sm:px-2">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <section className="flex flex-col items-center space-y-3 text-center">
          <div className="relative">
            <div className="flex size-28 items-center justify-center rounded-full border-4 border-secondary bg-card shadow-[0_12px_32px_rgba(25,28,29,0.06)]">
              <Trophy
                className="size-14 text-amber-500"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
            <PartyPopper
              className="absolute -inset-s-3 -top-1 size-8 text-primary opacity-90"
              aria-hidden
            />
            <Sparkles
              className="absolute -inset-e-2 top-2 size-6 text-secondary-foreground"
              aria-hidden
            />
          </div>
          <h1 className="font-heading text-2xl font-black text-primary sm:text-3xl">
            !پیروزی برای {winner?.displayName ?? "بازیکن"}
          </h1>
          <p className="max-w-sm text-sm font-medium text-muted-foreground">
            یک دور بازی هیجان‌انگیز به پایان رسید
          </p>
        </section>

        {rsLen > 0 && winner ? (
          <div className="space-y-3">
            <p className="text-center text-xs font-bold text-muted-foreground">
              پاسخ بقیه بازیکنان در هر دور (برنده: {winner.displayName})
            </p>
            <div
              className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="دورها"
            >
              {roundsSummary.map((r, i) => {
                const on = i === safeRoundIdx;
                return (
                  <button
                    key={r.roundNumber}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setRoundIdx(i)}
                    className={cn(
                      "shrink-0 rounded-full px-3.5 py-2 text-xs font-black transition-colors",
                      on
                        ? "bg-primary text-white shadow-sm"
                        : "bg-secondary text-muted-foreground hover:bg-muted",
                    )}
                  >
                    دور {faDigits(r.roundNumber)} · {r.letter}
                  </button>
                );
              })}
            </div>
            <Card className="border-border/60 shadow-[0_12px_32px_rgba(25,28,29,0.06)]">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-base text-primary">
                  جزئیات این دور
                </CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  حرف{" "}
                  <span className="font-bold text-primary">
                    {activeRound?.letter ?? "—"}
                  </span>
                </p>
              </CardHeader>
              <CardContent className="space-y-0 pt-0">
                <ul className="divide-y divide-border/50">
                  {data.categories.map((c) => {
                    const Icon = categoryIcon(c.key);
                    return (
                      <li
                        key={c.key}
                        className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-start sm:gap-4"
                      >
                        <span className="flex shrink-0 items-center gap-2.5 sm:w-[40%]">
                          <Icon
                            className="size-5 shrink-0 text-primary"
                            aria-hidden
                          />
                          <span className="text-xs font-bold text-muted-foreground">
                            {c.title}
                          </span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <CategoryPlayerTabs
                            players={activeRoundPlayers}
                            categoryKey={c.key}
                            meRoomPlayerId={data.meRoomPlayerId}
                            excludedPlayerIds={[winner.roomPlayerId]}
                            showScores
                            isDuplicate={isDuplicateForActiveRound}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-border/60 shadow-[0_12px_32px_rgba(25,28,29,0.06)]">
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <div>
                <CardTitle className="font-heading text-base text-primary">
                  جزئیات امتیازات
                </CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  آخرین دور · حرف{" "}
                  <span className="font-bold text-primary">
                    {data.round?.letter ?? "—"}
                  </span>
                </p>
              </div>
              <Badge className="rounded-full border-0 bg-secondary font-heading text-xs font-bold text-secondary-foreground">
                برنده
              </Badge>
            </CardHeader>
            <CardContent className="space-y-0 pt-0">
              <ul className="divide-y divide-border/50">
                {roundRows.map((row) => (
                  <li
                    key={row.key}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <row.Icon
                        className="size-5 shrink-0 text-primary"
                        aria-hidden
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-muted-foreground">
                          {row.title}
                        </span>
                        <span className="block truncate font-semibold text-foreground">
                          {row.value}
                        </span>
                      </span>
                    </span>
                    <span
                      className="shrink-0 font-heading text-base font-black text-primary"
                      dir="ltr"
                    >
                      +{faDigits(row.score)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-dashed border-border/60 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-muted-foreground">
                    مجموع دور (برنده)
                  </span>
                  <span className="flex items-center gap-1.5 font-heading text-2xl font-black text-amber-600">
                    {faDigits(roundTotal)}
                    <Star
                      className="size-6 fill-amber-400 text-amber-600"
                      aria-hidden
                    />
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="overflow-hidden rounded-3xl bg-linear-to-l from-primary to-primary/80 px-4 py-4 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Zap className="size-7 text-secondary" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white/80">پیشرفت کلی</p>
              <p className="font-heading text-xl font-black">
                {faDigits(data.game.totalRounds)} مرحله
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/20">
                <div
                  className="h-full rounded-full bg-secondary transition-all duration-500"
                  style={{ width: `${levelPct}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] font-medium text-white/85">
                {faDigits(levelPct)}٪ تا سطح بعدی (تخمینی)
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-heading text-lg font-black text-primary">
              <BarChart3 className="size-5" aria-hidden />
              رتبه‌بندی کلی
            </h2>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              آپدیت شده
            </span>
          </div>
          <ul className="space-y-2.5">
            {data.leaderboard.map((row, i) => {
              const rank = i + 1;
              const isTop = rank === 1;
              const isMe = row.roomPlayerId === data.meRoomPlayerId;
              const initial = row.displayName.trim().slice(0, 1) || "؟";
              return (
                <li
                  key={row.roomPlayerId}
                  className={
                    isTop
                      ? "relative flex items-center gap-3 overflow-hidden rounded-2xl border-2 border-secondary bg-card py-3 pe-4 ps-3 shadow-[0_12px_32px_rgba(25,28,29,0.06)] dark:bg-zinc-900/60"
                      : "flex items-center gap-3 rounded-2xl border border-border/60 bg-white py-3 pe-4 ps-3 dark:bg-zinc-900/40"
                  }
                >
                  {isTop ? (
                    <span
                      className="absolute inset-y-2 inset-s-0 w-1 rounded-e-full bg-secondary"
                      aria-hidden
                    />
                  ) : null}
                  <div
                    className={
                      isTop
                        ? "flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-100 font-heading text-lg font-black text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
                        : "flex size-11 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-lg font-black text-muted-foreground"
                    }
                    aria-hidden
                  >
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-foreground">
                      {row.displayName}
                      {isMe ? (
                        <span className="me-1 text-xs font-semibold text-primary">
                          (شما)
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      رتبه {faDigits(rank)}
                    </p>
                  </div>
                  <span
                    className="shrink-0 font-heading text-lg font-black text-primary"
                    dir="ltr"
                  >
                    {faDigits(row.totalScore)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="flex flex-col gap-3 pt-2">
          {isHost ? (
            <Button
              type="button"
              disabled={busy}
              size="lg"
              onClick={() => void replay()}
              className="h-auto w-full gap-2 rounded-full py-5 font-heading text-base font-black shadow-lg"
            >
              <Play className="size-5" aria-hidden />
              بزن بریم دور بعدی
            </Button>
          ) : (
            <Button
              render={<Link href={`/lobby/${data.roomCode}`} />}
              nativeButton={false}
              size="lg"
              variant="default"
              className="h-auto w-full gap-2 rounded-full py-5 font-heading text-base font-black shadow-lg"
            >
              <Play className="size-5" aria-hidden />
              بازگشت به لابی
            </Button>
          )}
          <Button
            render={<Link href="/" />}
            nativeButton={false}
            variant="outline"
            size="lg"
            className="h-auto w-full gap-2 rounded-full border-border py-5 font-heading text-base font-bold"
          >
            <Home className="size-5" aria-hidden />
            بازگشت به منوی اصلی
          </Button>
        </div>
      </main>
    </div>
  );
}
