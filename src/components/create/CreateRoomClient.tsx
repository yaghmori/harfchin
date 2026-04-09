"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCreateRoomMutation } from "@/hooks/api-mutations";
import { useSyncErrorToToast } from "@/hooks/use-sync-error-toast";
import { MAX_ROOM_TITLE_LENGTH } from "@/lib/constants";
import { faDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { fieldErrorsFromZodIssues } from "@/lib/zod-field-errors";
import {
  CirclePlus,
  Globe,
  ListOrdered,
  Lock,
  Timer,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const TIME_OPTIONS = [
  { value: 60, label: `${faDigits(60)} ثانیه` },
  { value: 90, label: `${faDigits(90)} ثانیه` },
  { value: 120, label: `${faDigits(2)} دقیقه` },
] as const;

type TimeChoice = (typeof TIME_OPTIONS)[number]["value"];

const MIN_PLAYERS = 2;
const MAX_PLAYERS_UI = 12;
const MIN_ROUNDS = 1;
const MAX_ROUNDS = 30;

type FormFieldKey = "title" | "maxPlayers" | "rounds";

const createRoomFormSchema = z.object({
  title: z
    .string()
    .min(1, "نام اتاق را وارد کنید.")
    .max(
      MAX_ROOM_TITLE_LENGTH,
      `حداکثر ${faDigits(MAX_ROOM_TITLE_LENGTH)} کاراکتر مجاز است.`,
    ),
  maxPlayers: z
    .number()
    .int("تعداد بازیکنان باید عدد صحیح باشد.")
    .min(MIN_PLAYERS, `حداقل ${faDigits(MIN_PLAYERS)} بازیکن لازم است.`)
    .max(MAX_PLAYERS_UI, `حداکثر ${faDigits(MAX_PLAYERS_UI)} بازیکن مجاز است.`),
  rounds: z
    .number()
    .int("تعداد دورها باید عدد صحیح باشد.")
    .min(MIN_ROUNDS, `حداقل ${faDigits(MIN_ROUNDS)} دور.`)
    .max(MAX_ROUNDS, `حداکثر ${faDigits(MAX_ROUNDS)} دور.`),
});

const numberStepperInputClass =
  "h-12 max-w-22 flex-1 rounded-xl border-0 bg-transparent text-center text-3xl font-bold tabular-nums leading-none shadow-none outline-none ring-0 ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 aria-invalid:ring-0 md:h-14 md:text-2xl [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]";

function clampRounds(n: number) {
  return Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, Math.round(n)));
}

export function CreateRoomClient() {
  const router = useRouter();
  const [roomTitle, setRoomTitle] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [rounds, setRounds] = useState(5);
  const [seconds, setSeconds] = useState<TimeChoice>(60);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FormFieldKey, string>>
  >({});
  const createRoomMutation = useCreateRoomMutation();
  const loading = createRoomMutation.isPending;

  useSyncErrorToToast(error);

  function clearField(field: FormFieldKey) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const roundsClamped = clampRounds(rounds);
    if (roundsClamped !== rounds) setRounds(roundsClamped);

    const parsed = createRoomFormSchema.safeParse({
      title: roomTitle.trim(),
      maxPlayers,
      rounds: roundsClamped,
    });

    if (!parsed.success) {
      const nextErrors = fieldErrorsFromZodIssues(
        parsed.error.issues,
      ) as Partial<Record<FormFieldKey, string>>;
      setFieldErrors(nextErrors);
      toast.error(parsed.error.issues[0]?.message ?? "ورودی‌ها را بررسی کنید.");
      return;
    }

    try {
      const data = await createRoomMutation.mutateAsync({
        title: parsed.data.title,
        isPrivate: !isPublic,
        draftTotalRounds: parsed.data.rounds,
        draftRoundTimeSec: seconds,
        maxPlayers: parsed.data.maxPlayers,
      });
      toast.success("اتاق ساخته شد. در حال ورود به لابی...");
      router.push(`/lobby/${data.roomCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    } finally {
      createRoomMutation.reset();
    }
  }

  return (
    <div dir="rtl" lang="fa" className="min-h-[min(100dvh,880px)] pb-8">
      <h1 className="sr-only">ایجاد اتاق</h1>

      <main className="mx-auto max-w-2xl px-4 pt-2 pb-6 sm:px-6">
        <Card className="gap-0 overflow-visible shadow-md">
          <CardContent className="space-y-0 pt-2 pb-4">
            <form
              id="create-room-form"
              onSubmit={handleCreate}
              className="space-y-6"
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="room-title" className="text-primary">
                  نام اتاق بازی
                </Label>
                <Input
                  id="room-title"
                  name="title"
                  disabled={loading}
                  value={roomTitle}
                  onChange={(e) => {
                    setRoomTitle(e.target.value);
                    clearField("title");
                  }}
                  placeholder="مثلاً: جمع دوستانه جمعه‌ها"
                  dir="rtl"
                  className="h-14 rounded-2xl border-border/60 bg-background text-right text-base font-semibold md:text-base"
                  aria-invalid={Boolean(fieldErrors.title)}
                  aria-describedby={
                    fieldErrors.title ? "room-title-error" : undefined
                  }
                />
                {fieldErrors.title ? (
                  <p
                    id="room-title-error"
                    className="text-sm font-medium text-destructive"
                    role="alert"
                  >
                    {fieldErrors.title}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={isPublic ? "default" : "outline"}
                  size="lg"
                  disabled={loading}
                  onClick={() => setIsPublic(true)}
                  className="h-auto min-h-14 flex-col gap-1 rounded-2xl py-4 font-bold"
                >
                  <Globe
                    className="size-6 shrink-0"
                    strokeWidth={isPublic ? 2.5 : 1.5}
                    aria-hidden
                  />
                  عمومی
                </Button>
                <Button
                  type="button"
                  variant={!isPublic ? "default" : "outline"}
                  size="lg"
                  disabled={loading}
                  onClick={() => setIsPublic(false)}
                  className="h-auto min-h-14 flex-col gap-1 rounded-2xl py-4 font-bold"
                >
                  <Lock
                    className="size-6 shrink-0"
                    strokeWidth={!isPublic ? 2.5 : 1.5}
                    aria-hidden
                  />
                  خصوصی
                </Button>
              </div>

              <div className="space-y-6 pt-6 sm:pt-8">
                <Separator />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="size-5 text-primary" aria-hidden />
                      <Label
                        htmlFor="room-max-players"
                        className="text-sm font-bold text-foreground"
                      >
                        تعداد بازیکنان
                      </Label>
                    </div>
                    <div
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-2xl border border-border/50 bg-muted/30 p-1.5 transition-[box-shadow,border-color]",
                        fieldErrors.maxPlayers &&
                          "border-destructive/50 ring-2 ring-destructive/25",
                      )}
                    >
                      <Button
                        type="button"
                        size="icon-lg"
                        disabled={loading || maxPlayers >= MAX_PLAYERS_UI}
                        onClick={() => {
                          setMaxPlayers((prev) =>
                            Math.min(MAX_PLAYERS_UI, prev + 1),
                          );
                          clearField("maxPlayers");
                        }}
                        className="shrink-0 rounded-xl text-lg font-bold"
                        aria-label="افزایش تعداد بازیکن"
                      >
                        +
                      </Button>
                      <Input
                        id="room-max-players"
                        type="number"
                        inputMode="numeric"
                        disabled={loading}
                        value={maxPlayers}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") return;
                          const next = Number(raw);
                          if (Number.isNaN(next)) return;
                          setMaxPlayers(
                            Math.min(
                              MAX_PLAYERS_UI,
                              Math.max(MIN_PLAYERS, next),
                            ),
                          );
                          clearField("maxPlayers");
                        }}
                        className={numberStepperInputClass}
                        aria-invalid={Boolean(fieldErrors.maxPlayers)}
                        aria-describedby={
                          fieldErrors.maxPlayers
                            ? "room-max-players-error"
                            : undefined
                        }
                        aria-label="تعداد بازیکنان"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon-lg"
                        disabled={loading || maxPlayers <= MIN_PLAYERS}
                        onClick={() => {
                          setMaxPlayers((prev) =>
                            Math.max(MIN_PLAYERS, prev - 1),
                          );
                          clearField("maxPlayers");
                        }}
                        className="shrink-0 rounded-xl text-lg font-bold"
                        aria-label="کاهش تعداد بازیکن"
                      >
                        −
                      </Button>
                    </div>
                    {fieldErrors.maxPlayers ? (
                      <p
                        id="room-max-players-error"
                        className="text-sm font-medium text-destructive"
                        role="alert"
                      >
                        {fieldErrors.maxPlayers}
                      </p>
                    ) : (
                      <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>حداکثر: {faDigits(MAX_PLAYERS_UI)} نفر</span>
                        <span>حداقل: {faDigits(MIN_PLAYERS)} نفر</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ListOrdered
                          className="size-5 text-primary"
                          aria-hidden
                        />
                        <Label
                          htmlFor="room-rounds"
                          className="text-sm font-bold text-foreground"
                        >
                          تعداد دورها
                        </Label>
                      </div>
                      <div
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-2xl border border-border/50 bg-muted/30 p-1.5 transition-[box-shadow,border-color]",
                          fieldErrors.rounds &&
                            "border-destructive/50 ring-2 ring-destructive/25",
                        )}
                      >
                        <Button
                          type="button"
                          size="icon-lg"
                          disabled={loading || rounds >= MAX_ROUNDS}
                          onClick={() => {
                            setRounds((prev) => clampRounds(prev + 1));
                            clearField("rounds");
                          }}
                          className="shrink-0 rounded-xl text-lg font-bold"
                          aria-label="افزایش تعداد دور"
                        >
                          +
                        </Button>
                        <Input
                          id="room-rounds"
                          type="number"
                          inputMode="numeric"
                          disabled={loading}
                          value={rounds}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === "") return;
                            const next = Number(raw);
                            if (Number.isNaN(next)) return;
                            setRounds(clampRounds(next));
                            clearField("rounds");
                          }}
                          onBlur={() => setRounds((r) => clampRounds(r))}
                          className={numberStepperInputClass}
                          aria-invalid={Boolean(fieldErrors.rounds)}
                          aria-describedby={
                            fieldErrors.rounds ? "room-rounds-error" : undefined
                          }
                          aria-label="تعداد دورها"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon-lg"
                          disabled={loading || rounds <= MIN_ROUNDS}
                          onClick={() => {
                            setRounds((prev) => clampRounds(prev - 1));
                            clearField("rounds");
                          }}
                          className="shrink-0 rounded-xl text-lg font-bold"
                          aria-label="کاهش تعداد دور"
                        >
                          −
                        </Button>
                      </div>
                      {fieldErrors.rounds ? (
                        <p
                          id="room-rounds-error"
                          className="text-sm font-medium text-destructive"
                          role="alert"
                        >
                          {fieldErrors.rounds}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Timer className="size-5 text-primary" aria-hidden />
                        <span className="text-sm font-bold text-foreground">
                          زمان هر دور
                        </span>
                      </div>
                      <div
                        className="grid grid-cols-3 gap-1.5 rounded-2xl border border-border/50 bg-muted/30 p-1.5"
                        role="tablist"
                        aria-label="انتخاب زمان هر دور"
                      >
                        {TIME_OPTIONS.map((option) => {
                          const active = seconds === option.value;
                          return (
                            <Button
                              key={option.value}
                              type="button"
                              role="tab"
                              aria-selected={active}
                              variant={active ? "default" : "ghost"}
                              size="sm"
                              disabled={loading}
                              onClick={() =>
                                setSeconds(option.value as TimeChoice)
                              }
                              className={cn(
                                "h-auto min-h-10 rounded-xl px-2 py-2 text-xs font-bold sm:text-sm",
                                !active && "text-muted-foreground",
                              )}
                            >
                              {option.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Button
          type="submit"
          form="create-room-form"
          size="lg"
          disabled={loading}
          className="mt-5 w-full rounded-2xl text-base font-bold shadow-md sm:mt-6 sm:h-16 sm:text-lg"
        >
          <CirclePlus className="size-6 shrink-0 sm:size-7" aria-hidden />
          {loading ? "در حال ایجاد…" : "ایجاد اتاق"}
        </Button>
      </main>
    </div>
  );
}
