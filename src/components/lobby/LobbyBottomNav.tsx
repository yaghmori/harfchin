import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Gamepad2, Settings, Trophy, Users } from "lucide-react";

export function LobbyBottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-[2.5rem] border-t border-ka-surface-container-high bg-white/90 px-2 pt-3 pb-6 shadow-[0_-8px_24px_rgba(0,0,0,0.04)] backdrop-blur-lg md:hidden dark:bg-zinc-950/90"
      aria-label="ناوبری اصلی"
    >
      <span className="flex flex-col items-center justify-center rounded-2xl bg-ka-primary/10 px-4 py-2 text-ka-primary">
        <Gamepad2 className="size-6" aria-hidden />
        <span className="mt-0.5 text-[10px] font-black">بازی</span>
      </span>
      <Button
        render={<Link href="/rooms" />}
        nativeButton={false}
        variant="ghost"
        className="h-auto flex-col gap-0.5 rounded-2xl px-4 py-2 text-ka-on-surface-variant hover:text-ka-primary"
      >
        <Users className="size-6" />
        <span className="text-[10px] font-bold">روم‌ها</span>
      </Button>
      <Button
        render={<Link href="/" />}
        nativeButton={false}
        variant="ghost"
        className="h-auto flex-col gap-0.5 rounded-2xl px-4 py-2 text-ka-on-surface-variant hover:text-ka-primary"
      >
        <Trophy className="size-6" />
        <span className="text-[10px] font-bold">رتبه‌بندی</span>
      </Button>
      <Button
        render={<Link href="/" />}
        nativeButton={false}
        variant="ghost"
        className="h-auto flex-col gap-0.5 rounded-2xl px-4 py-2 text-ka-on-surface-variant hover:text-ka-primary"
      >
        <Settings className="size-6" />
        <span className="text-[10px] font-bold">تنظیمات</span>
      </Button>
    </nav>
  );
}
