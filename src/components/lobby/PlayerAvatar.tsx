import { cn } from "@/lib/utils";

function initials(name: string) {
  const t = name.trim();
  if (!t) return "?";
  return t.slice(0, 1);
}

export function PlayerAvatar({
  name,
  size = "md",
  dimmed,
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  dimmed?: boolean;
  className?: string;
}) {
  const sz =
    size === "lg"
      ? "size-16 text-xl"
      : size === "sm"
        ? "size-8 text-xs"
        : "size-14 text-lg";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/15 font-black text-primary ring-primary/10",
        sz,
        dimmed && "opacity-40 grayscale",
        size === "lg" && "ring-4 ring-primary/20",
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}

export function playerInitials(name: string) {
  return initials(name);
}
