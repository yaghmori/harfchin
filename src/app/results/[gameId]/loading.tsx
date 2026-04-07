import { Skeleton } from "@/components/ui/skeleton";

export default function ResultsLoading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4">
      <Skeleton className="h-32 w-full max-w-md" />
      <p className="text-sm text-muted-foreground">در حال بارگذاری نتایج…</p>
    </div>
  );
}
