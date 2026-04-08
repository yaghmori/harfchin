import Link from "next/link";

type SectionHeaderProps = {
  title: string;
  actionHref: string;
  actionLabel: string;
};

export function SectionHeader({
  title,
  actionHref,
  actionLabel,
}: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <Link
        href={actionHref}
        className="shrink-0 text-sm font-bold text-[#7E3AF2] hover:underline dark:text-violet-400"
      >
        {actionLabel}
      </Link>
      <h2 className="text-base font-black text-foreground">{title}</h2>
    </div>
  );
}
