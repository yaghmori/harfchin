import { Flame, Target, Trophy, Zap } from "lucide-react";

const ICONS = {
  zap: Zap,
  trophy: Trophy,
  target: Target,
  flame: Flame,
} as const;

type Props = {
  titleFa: string;
  icon: keyof typeof ICONS;
  progressPercent: number;
};

export function AchievementMiniCard({ titleFa, icon, progressPercent }: Props) {
  const Icon = ICONS[icon];
  const p = Math.min(100, Math.max(0, progressPercent));
  const r = 26;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;

  return (
    <div className="flex w-[112px] shrink-0 flex-col items-center gap-2 rounded-2xl border border-violet-100 bg-white p-3 shadow-[0_4px_14px_rgba(126,58,242,0.08)] dark:border-violet-900/40 dark:bg-zinc-900/80">
      <div className="relative grid size-[72px] place-items-center">
        <svg
          className="absolute size-[72px] -rotate-90"
          viewBox="0 0 72 72"
          aria-hidden
        >
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            className="text-violet-100 dark:text-violet-950"
          />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke="#7E3AF2"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
          />
        </svg>
        <Icon className="relative size-7 text-[#7E3AF2]" aria-hidden />
      </div>
      <p className="text-center text-xs font-bold text-zinc-800 dark:text-zinc-100">
        {titleFa}
      </p>
      <p className="text-[10px] font-medium text-violet-600/90 dark:text-violet-300/90">
        {p.toLocaleString("fa-IR")}٪ تکمیل شده
      </p>
    </div>
  );
}
