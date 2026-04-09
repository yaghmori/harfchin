"use client";

import { RoundResultsTable } from "@/components/game/RoundResultsTable";
import { pickAnswerForCategory } from "@/components/game/round-answer-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { validateAnswerForLetter } from "@/domain/rules/answer-validation";
import {
  useCompleteRoundMutation,
  useEndGameMutation,
  useNextRoundMutation,
} from "@/hooks/api-mutations";
import { useGameStateByRoomQuery } from "@/hooks/api-queries";
import { useSyncErrorToToast } from "@/hooks/use-sync-error-toast";
import { faDigits } from "@/lib/format";
import type { LucideIcon } from "lucide-react";
import {
  Apple,
  Briefcase,
  Building2,
  Car,
  Flower2,
  Hand,
  MapPin,
  OctagonX,
  Palette,
  PawPrint,
  PenLine,
  Sparkles,
  Star,
  User,
  Users,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

const ANSWER_INPUT_PLACEHOLDER = "چیزی بنویسید…";

function TimerRing({
  progress,
  className,
}: {
  /** 0 = empty, 1 = full time remaining */
  progress: number;
  className?: string;
}) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, progress)));
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden>
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="8"
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        className="transition-[stroke-dashoffset] duration-700 ease-linear"
      />
    </svg>
  );
}

export function GameClient({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const [localError, setLocalError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [formState, setFormState] = useState<{
    roundId: string | null;
    values: Record<string, string>;
  }>({ roundId: null, values: {} });
  const [waitHint, setWaitHint] = useState<string | null>(null);
  const [endGameDialogOpen, setEndGameDialogOpen] = useState(false);
  const gameQuery = useGameStateByRoomQuery(roomCode);
  const completeRoundMutation = useCompleteRoundMutation();
  const nextRoundMutation = useNextRoundMutation();
  const endGameMutation = useEndGameMutation();
  const state = gameQuery.data ?? null;
  const queryError =
    gameQuery.error instanceof Error ? gameQuery.error.message : null;
  const error = localError ?? queryError;
  const busy =
    completeRoundMutation.isPending ||
    nextRoundMutation.isPending ||
    endGameMutation.isPending;

  useSyncErrorToToast(error);

  useEffect(() => {
    if (!state) return;
    if (state.phase === "none" || !state.game) {
      router.replace(`/lobby/${roomCode}`);
    }
  }, [state, roomCode, router]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (state?.phase === "finished" && state.game?.id) {
      router.replace(`/results/${state.game.id}`);
    }
  }, [state?.phase, state?.game?.id, router]);

  const isHost = state?.hostUserId === state?.meUserId;

  function emptyFormForCurrentCategories() {
    const next: Record<string, string> = {};
    for (const c of state?.categories ?? []) next[c.key] = "";
    return next;
  }

  const currentRoundId = state?.round?.id ?? null;
  const form =
    formState.roundId === currentRoundId
      ? formState.values
      : emptyFormForCurrentCategories();

  const secondsLeft =
    state?.round == null
      ? 0
      : Math.max(
          0,
          Math.ceil((new Date(state.round.endsAt).getTime() - nowMs) / 1000),
        );

  async function completeRoundAction() {
    if (!state?.game) return;
    const allFilled =
      state.categories.length > 0 &&
      state.categories.every((c) => (form[c.key] ?? "").trim().length > 0);
    if (!isHost && !allFilled) return;

    setWaitHint(null);
    try {
      const answers = state.categories.map((c) => ({
        categoryKey: c.key,
        value: form[c.key] ?? "",
      }));
      const res = await completeRoundMutation.mutateAsync({
        roomCode,
        answers,
      });
      setLocalError(null);

      if (res.outcome === "game_finished") {
        router.push(`/results/${res.gameId}`);
        return;
      }
      if (res.outcome === "waiting_for_players") {
        setWaitHint(
          `${faDigits(res.readyCount)} از ${faDigits(res.totalPlayers)} نفر آماده‌اند؛ منتظر بقیه…`,
        );
      }
      await gameQuery.refetch();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "خطا");
    }
  }

  async function startNextRound() {
    try {
      const res = await nextRoundMutation.mutateAsync({ roomCode });
      if (res.finished) {
        router.push(`/results/${res.gameId}`);
      } else {
        await gameQuery.refetch();
      }
      setLocalError(null);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "خطا");
    }
  }

  function requestEndGame() {
    setEndGameDialogOpen(true);
  }

  async function confirmEndGame() {
    try {
      const { gameId } = await endGameMutation.mutateAsync({ roomCode });
      setEndGameDialogOpen(false);
      router.push(`/results/${gameId}`);
      setLocalError(null);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "خطا");
    }
  }

  const endGameAlertDialog = (
    <AlertDialog open={endGameDialogOpen} onOpenChange={setEndGameDialogOpen}>
      <AlertDialogContent dir="rtl" className="text-right">
        <AlertDialogHeader>
          <AlertDialogTitle>پایان اجباری بازی؟</AlertDialogTitle>
          <AlertDialogDescription>
            بازی برای همه بازیکنان تمام می‌شود و به صفحهٔ نتایج نهایی می‌روید.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:flex-row-reverse">
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            className="min-h-11 w-full sm:w-auto"
            onClick={() => void confirmEndGame()}
          >
            پایان بازی
          </Button>
          <AlertDialogCancel className="border-border">
            انصراف
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (error && !state) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-5"
        dir="rtl"
      >
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Link
          href="/"
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          خانه
        </Link>
      </div>
    );
  }

  if (state?.phase === "finished" && state.game) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-5 text-foreground">
        <p className="font-medium text-muted-foreground">
          در حال انتقال به نتایج نهایی…
        </p>
      </div>
    );
  }

  if (!state?.game || !state.round) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center bg-background px-5 text-muted-foreground"
        dir="rtl"
      >
        <p className="text-center text-sm font-medium">در حال اتصال به بازی…</p>
      </div>
    );
  }

  const game = state.game;
  const round = state.round;
  const g = state;
  const phase = g.phase;
  const letter = round.letter;

  const allFieldsFilled =
    g.categories.length > 0 &&
    g.categories.every((c) => (form[c.key] ?? "").trim().length > 0);
  const canComplete = isHost || allFieldsFilled;

  const timerProgress =
    game.roundTimeSec > 0 ? Math.min(1, secondsLeft / game.roundTimeSec) : 0;

  const mePlayer =
    g.meRoomPlayerId == null
      ? null
      : (g.players.find((p) => p.id === g.meRoomPlayerId) ?? null);

  const myBoardScore =
    g.leaderboard.find((l) => l.roomPlayerId === g.meRoomPlayerId)
      ?.totalScore ?? 0;

  const displayInitial =
    mePlayer?.displayName?.trim().slice(0, 1) ?? letter ?? "?";

  function answersForCategory(catKey: string) {
    return g.players.map((p) => {
      const answer = pickAnswerForCategory(
        p.answers as unknown as Record<string, unknown>[],
        catKey,
      );
      return { player: p, answer };
    });
  }

  function isDuplicate(catKey: string, normalized: string, isValid: boolean) {
    if (!isValid || !normalized) return false;
    const vals = answersForCategory(catKey)
      .map(({ answer }) => (answer?.isValid ? answer.normalizedValue : ""))
      .filter(Boolean);
    return vals.filter((v) => v === normalized).length > 1;
  }

  const isLastRound = round.roundNumber >= game.totalRounds;

  if (phase === "round_results") {
    return (
      <>
        <div className="flex min-h-dvh flex-col bg-background text-foreground">
          <header className="sticky top-0 z-40 flex w-full items-center justify-between bg-white/80 px-5 py-4 shadow-[0_12px_32px_rgba(25,28,29,0.06)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading text-lg font-black text-primary"
                aria-hidden
              >
                {displayInitial}
              </div>
              <span className="font-heading text-lg font-black tracking-tight text-primary">
                حرفچین
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 font-heading text-sm font-semibold text-secondary-foreground">
              <span>{faDigits(myBoardScore)} امتیاز</span>
              <Star
                className="size-4 fill-amber-600 text-amber-700"
                aria-hidden
              />
            </div>
          </header>

          <main className="mx-auto w-full max-w-lg flex-1 space-y-5 px-5 pt-6">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                اتاق{" "}
                <span
                  className="font-mono font-semibold text-foreground"
                  dir="ltr"
                >
                  {roomCode}
                </span>
              </p>
              <div className="flex items-center gap-2 rounded-full bg-primary/15 px-4 py-2 font-heading text-sm font-black text-primary">
                <span>حرف این دور</span>
                <span className="text-lg">{letter}</span>
              </div>
            </div>

            <Link
              href={`/lobby/${roomCode}`}
              className="inline-block text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline"
            >
              بازگشت به لابی
            </Link>

            <section className="space-y-4">
              <div className="text-center">
                <h2 className="font-heading text-xl font-black text-foreground sm:text-2xl">
                  نتیجه این دور
                </h2>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  دور {faDigits(round.roundNumber)} از{" "}
                  {faDigits(game.totalRounds)}
                </p>
              </div>

              <Card className="border-border/60 shadow-[0_12px_32px_rgba(25,28,29,0.06)]">
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                  <div>
                    <CardTitle className="font-heading text-base text-primary">
                      پاسخ‌ها و امتیاز
                    </CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      جدول زیر همه بازیکن‌ها و پاسخ هر دسته را نشان می‌دهد.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-0 pt-0">
                  <RoundResultsTable
                    categories={g.categories}
                    players={g.players}
                    meRoomPlayerId={g.meRoomPlayerId}
                    isDuplicate={isDuplicate}
                  />
                </CardContent>
              </Card>

              {!isHost ? (
                <p className="text-center text-sm text-muted-foreground">
                  منتظر شروع دور بعد از طرف میزبان…
                </p>
              ) : null}

              {isHost ? (
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => void startNextRound()}
                    disabled={busy}
                    className="h-auto w-full rounded-full py-5 font-heading text-base font-black shadow-lg"
                  >
                    {isLastRound ? "پایان بازی و نتایج نهایی" : "دور بعد"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => requestEndGame()}
                    disabled={busy}
                    className="h-8 gap-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <OctagonX className="size-3.5 shrink-0" aria-hidden />
                    استپ
                  </Button>
                </div>
              ) : null}
            </section>
          </main>
        </div>
        {endGameAlertDialog}
      </>
    );
  }

  const playingChrome = (
    <>
      <header className="fixed top-0 z-50 w-full bg-white/80 shadow-[0_12px_32px_rgba(25,28,29,0.06)] backdrop-blur-xl dark:bg-zinc-950/80">
        <div className="mx-auto flex w-full max-w-lg flex-col px-5 pb-2 pt-4">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading text-lg font-black text-primary"
                aria-hidden
              >
                {displayInitial}
              </div>
              <div className="min-w-0 flex flex-col">
                <span className="font-heading text-lg font-black tracking-tight text-primary">
                  حرفچین
                </span>
                <span className="text-[10px] font-medium text-muted-foreground opacity-80">
                  اتاق{" "}
                  <span className="font-mono font-bold" dir="ltr">
                    {roomCode}
                  </span>
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 font-heading text-sm font-semibold text-secondary-foreground">
              <span>{faDigits(myBoardScore)} امتیاز</span>
              <Star
                className="size-4 fill-amber-600 text-amber-700"
                aria-hidden
              />
            </div>
          </div>
          {isHost ? (
            <div className="flex justify-end border-t border-zinc-200/80 pt-2 dark:border-zinc-800/80">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => requestEndGame()}
                disabled={busy}
                className="h-7 gap-1 px-2 text-[11px] font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <OctagonX className="size-3.5 shrink-0" aria-hidden />
                استپ
              </Button>
            </div>
          ) : null}
        </div>
      </header>

      <main
        className={`mx-auto w-full max-w-lg flex-1 space-y-8 px-5 pb-10 ${isHost ? "pt-29" : "pt-24"}`}
      >
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {waitHint ? (
          <p className="text-center text-sm font-medium text-primary">
            {waitHint}
          </p>
        ) : null}

        <header className="flex flex-col items-center space-y-5 pt-2">
          <div className="relative flex size-48 items-center justify-center">
            <TimerRing
              progress={timerProgress}
              className="absolute inset-0 size-full"
            />
            <div className="relative z-10 flex size-36 items-center justify-center rounded-full bg-card shadow-[0_12px_32px_rgba(25,28,29,0.06)]">
              <span className="font-heading text-7xl font-black leading-none text-primary sm:text-8xl">
                {letter}
              </span>
            </div>
            <div className="absolute bottom-1 z-20 rounded-full bg-secondary px-4 py-1 font-heading text-lg font-bold text-secondary-foreground shadow-md">
              {faDigits(secondsLeft)} ثانیه
            </div>
          </div>
          <div className="space-y-1 text-center">
            <p className="font-heading text-2xl font-black text-foreground">
              در حال بازی…
            </p>
            <p className="text-sm font-medium text-muted-foreground opacity-[0.85]">
              همه کلمات باید با حرف «{letter}» شروع شوند
            </p>
          </div>
        </header>

        <section className="space-y-3.5">
          {g.categories.map((c, index) => {
            const raw = form[c.key] ?? "";
            const { isValid } = validateAnswerForLetter(raw, letter);
            const filled = raw.trim().length > 0;
            const Icon = categoryIcon(c.key);
            const highlighted = filled && isValid;
            const isLastField = index === g.categories.length - 1;
            return (
              <Card
                key={c.key}
                size="sm"
                className={
                  highlighted
                    ? "group border-2 border-primary/25 bg-violet-50/90 dark:bg-violet-950/25"
                    : "group border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                }
              >
                <CardHeader className="space-y-0 pb-2">
                  <CardTitle
                    className={
                      highlighted
                        ? "text-xs font-bold tracking-wide text-primary uppercase"
                        : "text-xs font-bold tracking-wide text-zinc-400 uppercase"
                    }
                  >
                    {c.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-3 pb-4 pt-0">
                  {highlighted ? (
                    <Icon
                      className="size-6 shrink-0 self-center text-primary"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  ) : (
                    <Icon
                      className="size-6 shrink-0 self-center text-zinc-300 transition-colors group-focus-within:text-primary"
                      aria-hidden
                    />
                  )}
                  <Input
                    id={`cat-${c.key}`}
                    value={raw}
                    onChange={(e) =>
                      setFormState((prev) => {
                        const base =
                          prev.roundId === currentRoundId
                            ? prev.values
                            : emptyFormForCurrentCategories();
                        return {
                          roundId: currentRoundId,
                          values: { ...base, [c.key]: e.target.value },
                        };
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      const nextCat = g.categories[index + 1];
                      if (nextCat) {
                        document.getElementById(`cat-${nextCat.key}`)?.focus();
                      } else {
                        document.getElementById("round-end-submit")?.focus();
                      }
                    }}
                    enterKeyHint={isLastField ? "done" : "next"}
                    dir="auto"
                    autoComplete="off"
                    placeholder={ANSWER_INPUT_PLACEHOLDER}
                    className="h-14 min-h-14 flex-1 rounded-xl border-0 bg-secondary px-4 py-3 text-base font-semibold text-foreground shadow-[inset_0_1px_2px_rgb(0_0_0/0.04)] placeholder:text-muted-foreground/90 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:text-base"
                  />
                </CardContent>
              </Card>
            );
          })}
        </section>

        <p className="text-center text-xs text-muted-foreground">
          <Link
            href={`/lobby/${roomCode}`}
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
          >
            بازگشت به لابی
          </Link>
        </p>
      </main>

      <div className="pb-6">
        <div className="relative z-20 flex justify-center">
          <Button
            id="round-end-submit"
            type="button"
            size="lg"
            onClick={() => void completeRoundAction()}
            disabled={busy || !canComplete}
            className="h-auto gap-3 rounded-full px-10 py-5 font-heading text-xl font-black shadow-lg"
          >
            <span>پایان دور</span>
            <Hand className="size-7" aria-hidden />
          </Button>
        </div>
      </div>
    </>
  );

  if (phase === "processing_round") {
    return (
      <>
        <div
          className="flex min-h-dvh flex-col bg-background text-foreground"
          dir="rtl"
        >
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5">
            <div
              className="size-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
              aria-hidden
            />
            <p className="max-w-sm text-center text-sm font-medium text-muted-foreground">
              در حال پایان دور و محاسبه امتیاز…
            </p>
            {isHost ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => requestEndGame()}
                disabled={busy}
                className="h-8 gap-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <OctagonX className="size-3.5 shrink-0" aria-hidden />
                استپ
              </Button>
            ) : null}
          </div>
        </div>
        {endGameAlertDialog}
      </>
    );
  }

  if (phase === "playing") {
    return (
      <>
        <div className="flex min-h-dvh flex-col bg-background text-foreground">
          {playingChrome}
        </div>
        {endGameAlertDialog}
      </>
    );
  }

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center bg-background px-5 text-foreground"
      dir="rtl"
    >
      <p className="text-center text-sm text-muted-foreground">
        وضعیت بازی به‌روزرسانی می‌شود…
      </p>
    </div>
  );
}
