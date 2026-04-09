"use client";

import { JoinRoomNameDialog } from "@/components/rooms/PublicRoomJoin";
import type { AuthMePayload } from "@/hooks/api-queries";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { RoomState } from "@/components/lobby/types";
import { API_ENDPOINTS } from "@/features/api/endpoints";
import { apiGet } from "@/features/api/client";
import { useJoinRoomMutation } from "@/hooks/api-mutations";
import { useSyncErrorToToast } from "@/hooks/use-sync-error-toast";
import { MAX_DISPLAY_NAME_LENGTH } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { QrCode, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const ROOM_CODE_PATTERN = /[A-HJKLMNPQRSTUVWXYZ2-9]{4,8}/i;

function extractRoomCodeFromText(text: string): string | null {
  const t = text.trim();
  const m = t.match(ROOM_CODE_PATTERN);
  return m ? m[0].toUpperCase() : null;
}

function parseRoomCodeFromSearch(raw: string | null): string | null {
  if (!raw) return null;
  const decoded = decodeURIComponent(raw.trim());
  const m = decoded.match(ROOM_CODE_PATTERN);
  const next = (m ? m[0] : decoded.replace(/\s/g, "")).toUpperCase().slice(0, 8);
  return next.length >= 4 ? next : null;
}

export function JoinRoomForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [roomCode, setRoomCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const joinMutation = useJoinRoomMutation();
  const loading = joinMutation.isPending;

  const deepLinkCode = useMemo(
    () => parseRoomCodeFromSearch(searchParams.get("code")),
    [searchParams],
  );

  const [uiMode, setUiMode] = useState<
    "loading" | "standard" | "public_guest"
  >(() => (parseRoomCodeFromSearch(searchParams.get("code")) ? "loading" : "standard"));

  const [guestDialogOpen, setGuestDialogOpen] = useState(false);

  useSyncErrorToToast(error);

  useEffect(() => {
    const raw = searchParams.get("code");
    if (!raw) return;
    const next = parseRoomCodeFromSearch(raw);
    if (next) setRoomCode(next);
  }, [searchParams]);

  useEffect(() => {
    if (!deepLinkCode) {
      setUiMode("standard");
      return;
    }

    let cancelled = false;
    setUiMode("loading");

    (async () => {
      try {
        const state = await apiGet<RoomState>(
          API_ENDPOINTS.room.state(deepLinkCode),
        );
        if (cancelled) return;

        setRoomCode(state.roomCode);

        if (
          state.isPrivate ||
          state.status !== "waiting" ||
          state.players.length >= state.maxPlayers
        ) {
          setUiMode("standard");
          return;
        }

        const inRoom = state.players.some((p) => p.userId === state.meUserId);
        if (inRoom) {
          router.replace(`/lobby/${state.roomCode}`);
          return;
        }

        const { user } = await apiGet<AuthMePayload>(API_ENDPOINTS.auth.me);
        if (cancelled) return;

        if (user?.isRegistered && user.name?.trim()) {
          const data = await joinMutation.mutateAsync({
            roomCode: state.roomCode,
          });
          if (cancelled) return;
          joinMutation.reset();
          router.replace(`/lobby/${data.roomCode}`);
          return;
        }

        setUiMode("public_guest");
        setGuestDialogOpen(true);
      } catch {
        if (cancelled) return;
        setUiMode("standard");
        setRoomCode(deepLinkCode);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [deepLinkCode, joinMutation, router]);

  const openQrPicker = useCallback(() => {
    setError(null);
    qrInputRef.current?.click();
  }, []);

  const onQrFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setQrBusy(true);
    setError(null);
    try {
      const BD = (
        globalThis as unknown as {
          BarcodeDetector?: new (o: { formats: string[] }) => {
            detect: (src: ImageBitmap) => Promise<{ rawValue: string }[]>;
          };
        }
      ).BarcodeDetector;

      if (!BD) {
        setError(
          "اسکن QR در این مرورگر در دسترس نیست؛ کد را دستی وارد کنید یا مرورگر دیگری امتحان کنید.",
        );
        return;
      }

      const detector = new BD({ formats: ["qr_code"] });
      const bitmap = await createImageBitmap(file);
      try {
        const codes = await detector.detect(bitmap);
        const raw = codes[0]?.rawValue;
        if (!raw) {
          setError("کد QR خوانده نشد؛ تصویر واضح‌تری انتخاب کنید.");
          return;
        }
        const code = extractRoomCodeFromText(raw);
        if (!code) {
          setError("در این QR کد اتاقی پیدا نشد.");
          return;
        }
        setRoomCode(code);
        setUiMode("standard");
      } finally {
        bitmap.close();
      }
    } catch {
      setError("خواندن تصویر ناموفق بود؛ دوباره تلاش کنید.");
    } finally {
      setQrBusy(false);
    }
  }, []);

  const guestJoin = useCallback(
    async (name: string) => {
      setError(null);
      try {
        const data = await joinMutation.mutateAsync({
          roomCode: roomCode.trim(),
          displayName: name,
        });
        toast.success("به اتاق پیوستید.");
        router.push(`/lobby/${data.roomCode}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "خطا");
      } finally {
        joinMutation.reset();
      }
    },
    [joinMutation, roomCode, router],
  );

  async function submitStandardForm() {
    setError(null);
    try {
      const data = await joinMutation.mutateAsync({
        roomCode: roomCode.trim(),
        displayName,
      });
      toast.success("به اتاق پیوستید.");
      router.push(`/lobby/${data.roomCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    } finally {
      joinMutation.reset();
    }
  }

  const showFullFormFields = uiMode === "standard";
  const showPrimarySubmit = uiMode === "standard";
  const roomCodeFieldReadOnly = uiMode === "public_guest";
  const cardBusy = uiMode === "loading" || loading;

  return (
    <div
      className={cn(
        "relative flex min-h-dvh flex-col items-center bg-background text-foreground [-webkit-tap-highlight-color:transparent]",
      )}
    >
      <input
        ref={qrInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={onQrFile}
      />

      <div
        className="pointer-events-none fixed top-0 right-0 -z-20 size-96 rounded-full bg-primary/5 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 -z-20 size-80 rounded-full bg-secondary/40 blur-3xl"
        aria-hidden
      />

      <h1 className="sr-only">ورود به اتاق</h1>

      <main className="flex w-full max-w-md flex-col items-center px-6 pb-12 pt-4">
        <div className="relative mb-12 flex flex-col items-center justify-center">
          <div
            className="absolute -z-10 size-48 rounded-full bg-linear-to-tr from-primary/10 to-secondary/60 blur-2xl"
            aria-hidden
          />
          <div className="relative flex size-40 items-center justify-center overflow-hidden rounded-xl bg-card shadow-[0_12px_32px_rgba(25,28,29,0.06)] dark:bg-zinc-900 dark:shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
            <div
              className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent"
              aria-hidden
            />
            <div className="relative flex flex-col items-center">
              <Users
                className="mb-2 size-[4.5rem] text-primary"
                fill="currentColor"
                fillOpacity={0.12}
                aria-hidden
              />
              <div className="flex gap-2" aria-hidden>
                <span className="size-2 rounded-full bg-secondary-foreground/80" />
                <span className="size-2 rounded-full bg-primary/40" />
                <span className="size-2 rounded-full bg-primary/20" />
              </div>
            </div>
          </div>
          <div
            className="absolute -top-4 -right-4 flex size-12 rotate-12 items-center justify-center rounded-full bg-secondary shadow-lg"
            aria-hidden
          >
            <span className="text-xl font-black text-secondary-foreground">آ</span>
          </div>
          <div
            className="absolute -left-6 bottom-2 flex size-14 -rotate-12 items-center justify-center rounded-xl bg-primary/15 shadow-lg"
            aria-hidden
          >
            <span className="text-2xl font-black text-primary">ب</span>
          </div>
        </div>

        <Card
          className={cn(
            "w-full gap-0 rounded-lg border-0 bg-card py-0 shadow-[0_12px_32px_rgba(25,28,29,0.06)]",
            "dark:bg-zinc-900 dark:shadow-[0_12px_32px_rgba(0,0,0,0.35)]",
          )}
        >
          <CardContent className="p-8">
            {uiMode === "loading" ? (
              <p className="py-10 text-center text-base font-medium text-muted-foreground">
                در حال اتصال به اتاق…
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (uiMode !== "standard") return;
                  void submitStandardForm();
                }}
                className="flex flex-col gap-8"
              >
                <div className="space-y-4">
                  <Label
                    htmlFor="room-code"
                    className="flex w-full justify-center text-center text-sm font-medium font-normal text-muted-foreground dark:text-zinc-400"
                  >
                    کد اتاق را از سازنده بازی دریافت کنید
                  </Label>
                  <div className="group relative">
                    <Input
                      id="room-code"
                      name="roomCode"
                      required
                      readOnly={roomCodeFieldReadOnly}
                      maxLength={8}
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      dir="ltr"
                      autoComplete="off"
                      placeholder="کد ۶ رقمی را وارد کنید"
                      className={cn(
                        "h-auto min-h-14 border-0 bg-secondary py-5 text-center text-2xl font-black tracking-[0.35em] text-primary shadow-none",
                        "placeholder:text-base placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-300",
                        "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 dark:bg-zinc-800 dark:placeholder:text-zinc-500",
                        "md:text-2xl",
                        roomCodeFieldReadOnly && "opacity-90",
                      )}
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 h-1 origin-center scale-x-0 rounded-full bg-primary transition-transform group-focus-within:scale-x-100"
                      aria-hidden
                    />
                  </div>

                  {showFullFormFields ? (
                    <div className="space-y-2">
                      <Label
                        htmlFor="display-name"
                        className="flex w-full justify-center text-center text-sm font-medium font-normal text-muted-foreground dark:text-zinc-400"
                      >
                        نام نمایشی شما در اتاق
                      </Label>
                      <Input
                        id="display-name"
                        name="displayName"
                        required
                        maxLength={MAX_DISPLAY_NAME_LENGTH}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        autoComplete="nickname"
                        placeholder="مثلاً علی"
                        className={cn(
                          "auth-page h-auto min-h-12 rounded-full border-0 bg-secondary py-3.5 text-center text-base font-medium text-foreground shadow-none",
                          "placeholder:text-zinc-300 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 dark:bg-zinc-800 dark:placeholder:text-zinc-500",
                        )}
                      />
                    </div>
                  ) : uiMode === "public_guest" ? (
                    <p className="text-center text-sm text-muted-foreground">
                      برای ورود به این اتاق عمومی، فقط نام نمایشی لازم است.
                    </p>
                  ) : null}
                </div>

                {error ? (
                  <Alert variant="destructive" className="text-center">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                {uiMode === "public_guest" && !guestDialogOpen ? (
                  <Button
                    type="button"
                    variant="default"
                    disabled={cardBusy}
                    onClick={() => setGuestDialogOpen(true)}
                    className={cn(
                      "h-auto min-h-14 w-full rounded-full border-0 bg-linear-to-r from-primary to-primary/80 py-5 text-xl font-bold text-primary-foreground shadow-[0_8px_24px_rgba(99,14,212,0.3)]",
                      "hover:brightness-105 hover:shadow-[0_12px_32px_rgba(99,14,212,0.4)] active:translate-y-0 active:scale-95",
                    )}
                  >
                    ورود به لابی
                  </Button>
                ) : null}

                {showPrimarySubmit ? (
                  <Button
                    type="submit"
                    disabled={cardBusy}
                    variant="default"
                    className={cn(
                      "h-auto min-h-14 w-full rounded-full border-0 bg-linear-to-r from-primary to-primary/80 py-5 text-xl font-bold text-primary-foreground shadow-[0_8px_24px_rgba(99,14,212,0.3)]",
                      "hover:brightness-105 hover:shadow-[0_12px_32px_rgba(99,14,212,0.4)] active:translate-y-0 active:scale-95",
                    )}
                  >
                    {loading ? "در حال ورود…" : "بزن بریم!"}
                  </Button>
                ) : null}

                {showFullFormFields ? (
                  <>
                    <div className="flex items-center gap-4 py-2">
                      <Separator className="flex-1 bg-border dark:bg-zinc-700" />
                      <span className="shrink-0 text-sm font-medium text-zinc-400">یا</span>
                      <Separator className="flex-1 bg-border dark:bg-zinc-700" />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      disabled={qrBusy}
                      onClick={openQrPicker}
                      className={cn(
                        "h-auto min-h-14 w-full gap-3 rounded-full bg-muted py-4 text-base font-bold text-foreground hover:bg-secondary",
                        "dark:bg-zinc-800 dark:hover:bg-zinc-700",
                      )}
                    >
                      <QrCode className="size-7 shrink-0" aria-hidden />
                      {qrBusy ? "در حال خواندن…" : "اسکن کد QR"}
                    </Button>
                  </>
                ) : null}
              </form>
            )}
          </CardContent>
        </Card>

        <JoinRoomNameDialog
          open={guestDialogOpen}
          onOpenChange={setGuestDialogOpen}
          roomCode={roomCode}
          busy={loading}
          onJoin={guestJoin}
        />

        <div className="mt-12 px-4 text-center">
          <p className="text-sm leading-relaxed text-zinc-400 dark:text-zinc-500">
            هنوز اتاقی ندارید؟ می‌توانید یک{" "}
            <Link
              href="/create"
              className="font-bold text-primary hover:underline dark:text-violet-400"
            >
              اتاق جدید
            </Link>{" "}
            بسازید و دوستانتان را دعوت کنید.
          </p>
        </div>
      </main>
    </div>
  );
}
