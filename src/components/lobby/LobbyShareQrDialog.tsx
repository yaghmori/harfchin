"use client";

import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Copy, Link2, Share2 } from "lucide-react";
import QRCode from "qrcode";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type LobbyShareQrDialogProps = {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  roomCode: string;
};

export function LobbyShareQrDialog({
  open,
  onOpenChange,
  roomCode,
}: LobbyShareQrDialogProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/lobby/${encodeURIComponent(roomCode)}`;
  }, [roomCode]);

  useEffect(() => {
    if (!open || !joinUrl) return;

    let cancelled = false;
    void QRCode.toDataURL(joinUrl, {
      margin: 2,
      width: 232,
      errorCorrectionLevel: "M",
    })
      .then((u) => {
        if (!cancelled) setDataUrl(u);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [open, joinUrl]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(roomCode);
      toast.success("کد اتاق کپی شد.");
    } catch {
      toast.error("کپی کد انجام نشد.");
    }
  }

  async function copyLink() {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      toast.success("لینک اتاق کپی شد.");
    } catch {
      toast.error("کپی لینک انجام نشد.");
    }
  }

  async function share() {
    if (!joinUrl) return;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "دعوت به اتاق",
          text: `با کد ${roomCode} به اتاق بپیوندید.`,
          url: joinUrl,
        });
        return;
      }
      await copyLink();
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      toast.error("اشتراک‌گذاری انجام نشد.");
    }
  }

  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} size="md">
      <ResponsiveDialog.Header className="pb-2">
        <ResponsiveDialog.Title className="text-base font-black">
          اشتراک‌گذاری اتاق
        </ResponsiveDialog.Title>
        <ResponsiveDialog.Description className="text-right text-sm text-muted-foreground">
          کیوآر کد را اسکن کنید، کد یا لینک را برای دوستان بفرستید.
        </ResponsiveDialog.Description>
      </ResponsiveDialog.Header>

      <ResponsiveDialog.Content className="space-y-4">
        <div className="flex flex-col items-center gap-3">
          {dataUrl ? (
            // Data URL from qrcode; next/image does not optimize inline PNGs meaningfully.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt={`کیوآر کد ورود به اتاق ${roomCode}`}
              className="max-h-[40dvh] w-full max-w-[232px] rounded-2xl border border-border/80 bg-white p-2 shadow-sm object-contain"
            />
          ) : (
            <div
              className="flex aspect-square w-full max-w-[232px] max-h-[40dvh] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-xs text-muted-foreground"
              aria-hidden
            >
              در حال ساخت کیوآر…
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            کد اتاق
          </p>
          <div className="flex flex-row items-center justify-center">
            <code className="text-5xl font-black tracking-widest">
              {roomCode}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-14 shrink-0 rounded-xl"
              onClick={() => void copyCode()}
              aria-label="کپی کد اتاق"
            >
              <Copy className="size-8" />
            </Button>
          </div>
        </div>
      </ResponsiveDialog.Content>
      <ResponsiveDialog.Footer>
        <Button
          type="button"
          variant="default"
          size="lg"
          className="w-full shrink-0 rounded-xl sm:flex-1 "
          onClick={() => void copyLink()}
          disabled={!joinUrl}
        >
          <Link2 className="size-5" />
          کپی لینک
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full shrink-0 rounded-xl sm:flex-1 "
          onClick={() => void share()}
          disabled={!joinUrl}
        >
          <Share2 className="size-5" />
          {canShare ? "اشتراک‌گذاری" : "اشتراک (کپی لینک)"}
        </Button>
      </ResponsiveDialog.Footer>
    </ResponsiveDialog>
  );
}
