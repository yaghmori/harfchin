"use client";

import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { UserPlus } from "lucide-react";
import Link from "next/link";

type LobbyInviteLoginCtaProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomCode: string;
};

export function LobbyInviteLoginCta({
  open,
  onOpenChange,
  roomCode,
}: LobbyInviteLoginCtaProps) {
  const returnTo = `/lobby/${encodeURIComponent(roomCode)}`;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} size="md">
      <ResponsiveDialog.Header className="pb-2">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <UserPlus className="size-6" aria-hidden />
          </span>
          <div className="min-w-0 space-y-2 text-center sm:text-start">
            <ResponsiveDialog.Title className="text-base font-black">
              دعوت از دوستان
            </ResponsiveDialog.Title>
            <ResponsiveDialog.Description className="text-sm leading-relaxed text-muted-foreground">
              با ورود یا ثبت‌نام می‌توانید از لیست دوستان خود به‌صورت مستقیم به این اتاق
              دعوت کنید. اشتراک‌گذاری لینک و کد اتاق همچنان بدون ورود ممکن است.
            </ResponsiveDialog.Description>
          </div>
        </div>
      </ResponsiveDialog.Header>
      <ResponsiveDialog.Content className="space-y-3">
        <div className="flex flex-col gap-3 pt-1">
          <Button
            size="lg"
            className="w-full rounded-2xl font-bold shadow-md"
            render={<Link href={`/login?from=${encodeURIComponent(returnTo)}`} />}
            nativeButton={false}
          >
            ورود به حساب
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full rounded-2xl border-violet-200 font-bold dark:border-violet-800"
            render={<Link href={`/signup?from=${encodeURIComponent(returnTo)}`} />}
            nativeButton={false}
          >
            ساخت حساب جدید
          </Button>
        </div>
      </ResponsiveDialog.Content>
    </ResponsiveDialog>
  );
}
