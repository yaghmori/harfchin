import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { FriendsHubClient } from "@/components/friends/FriendsHubClient";
import { cn } from "@/lib/utils";
import { getSessionUser } from "@/server/session";

export const metadata: Metadata = {
  title: "دوستان",
};

export default async function FriendsPage() {
  const user = await getSessionUser();
  const isRegistered = !!(user && !user.isGuest && user.passwordHash);

  if (!isRegistered) {
    return (
      <div className="space-y-4 pt-2 text-center">
        <h1 className="sr-only">دوستان</h1>
        <p className="text-sm text-muted-foreground">
          برای مدیریت دوستان، درخواست‌ها و دعوت‌های بازی وارد حساب خود شوید.
        </p>
        <div className="flex justify-center gap-2">
          <Link href="/login?from=/friends" className={cn(buttonVariants())}>
            ورود
          </Link>
          <Link
            href="/signup?from=/friends"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            ثبت‌نام
          </Link>
        </div>
      </div>
    );
  }

  return <FriendsHubClient />;
}
