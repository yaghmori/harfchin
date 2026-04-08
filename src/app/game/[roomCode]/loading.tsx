import { Skeleton } from "@/components/ui/skeleton";

export default function GameLoading() {
  return (
    <div
      className="flex min-h-dvh flex-col gap-4 bg-background px-5 py-8"
      dir="rtl"
    >
      <div className="flex gap-2">
        <Skeleton className="h-14 flex-1 rounded-full" />
        <Skeleton className="h-14 flex-[1.5] rounded-2xl" />
        <Skeleton className="size-14 shrink-0 rounded-2xl" />
      </div>
      <Skeleton className="h-4 w-48" />
      <div className="grid gap-3 pt-2">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
      <Skeleton className="mt-4 h-12 w-full rounded-[1.35rem]" />
      <p className="text-center text-sm font-medium text-muted-foreground">
        در حال بارگذاری بازی…
      </p>
    </div>
  );
}
