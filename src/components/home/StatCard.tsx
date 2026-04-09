import { cn } from "@/lib/utils";
import { CoinImage } from "@/components/media/CoinImage";
import type { LucideIcon } from "lucide-react";

export type StatCardProps =
  | {
      label: string;
      value: string;
      icon: LucideIcon;
      useCoinAsset?: false;
      iconWrapperClassName?: string;
    }
  | {
      label: string;
      value: string;
      useCoinAsset: true;
      iconWrapperClassName?: string;
    };

export function StatCard(props: StatCardProps) {
  const { label, value, iconWrapperClassName } = props;

  return (
    <div className="flex flex-1 items-center gap-3 rounded-2xl border border-violet-100/80 bg-card p-4 shadow-sm dark:border-violet-900/40 dark:bg-zinc-900/50">
      <div className="min-w-0 flex-1 text-start">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 text-lg font-black text-foreground">{value}</p>
      </div>
      <div
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl bg-violet-100 dark:bg-violet-950/60",
          iconWrapperClassName,
        )}
      >
        {props.useCoinAsset ? (
          <CoinImage size={30} className="drop-shadow-sm" />
        ) : (
          <props.icon
            className="size-6 text-[#7E3AF2] dark:text-violet-300"
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
