import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-xl bg-muted/80 ring-1 ring-border/30",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
