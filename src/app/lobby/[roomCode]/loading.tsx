import { Skeleton } from "@/components/ui/skeleton";

export default function LobbyLoading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4">
      <Skeleton className="h-10 w-full max-w-sm" />
      <Skeleton className="h-4 w-48" />
      <p className="text-sm text-muted-foreground">در حال بارگذاری لابی…</p>
    </div>
  );
}
