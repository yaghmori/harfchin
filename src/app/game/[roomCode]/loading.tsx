import { Skeleton } from "@/components/ui/skeleton";

export default function GameLoading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4">
      <Skeleton className="h-10 w-full max-w-sm" />
      <Skeleton className="h-4 w-40" />
      <p className="text-sm text-muted-foreground">در حال بارگذاری بازی…</p>
    </div>
  );
}
