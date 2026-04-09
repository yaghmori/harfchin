"use client";

import { Badge } from "@/components/ui/badge";
import {
  formatAnswerCellText,
  pickAnswerForCategory,
  showInvalidBadge,
} from "@/components/game/round-answer-utils";
import { faDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

export type TabPlayer = {
  id: string;
  displayName: string;
  answers: {
    categoryKey: string;
    value: string;
    normalizedValue: string;
    isValid: boolean;
    score: number;
  }[];
};

type CategoryPlayerTabsProps = {
  players: TabPlayer[];
  categoryKey: string;
  meRoomPlayerId: string | null;
  /** If set, those room players are omitted (e.g. overall winner on final results). */
  excludedPlayerIds?: string[];
  showScores: boolean;
  isDuplicate: (
    categoryKey: string,
    normalizedValue: string,
    isValid: boolean,
  ) => boolean;
};

export function CategoryPlayerTabs({
  players,
  categoryKey,
  meRoomPlayerId,
  excludedPlayerIds,
  showScores,
  isDuplicate,
}: CategoryPlayerTabsProps) {
  const visible = useMemo(() => {
    let list = players;
    if (excludedPlayerIds?.length) {
      const ex = new Set(excludedPlayerIds);
      list = list.filter((p) => !ex.has(p.id));
    }
    const me = list.filter((p) => p.id === meRoomPlayerId);
    const rest = list
      .filter((p) => p.id !== meRoomPlayerId)
      .sort((a, b) =>
        a.displayName.localeCompare(b.displayName, "fa", {
          sensitivity: "base",
        }),
      );
    return [...me, ...rest];
  }, [players, excludedPlayerIds, meRoomPlayerId]);

  const defaultId = visible[0]?.id ?? null;
  const [picked, setPicked] = useState<string | null>(null);
  const activeId =
    picked && visible.some((v) => v.id === picked) ? picked : defaultId;

  if (visible.length === 0) {
    return (
      <span className="text-sm text-muted-foreground" dir="auto">
        —
      </span>
    );
  }

  const selected =
    visible.find((p) => p.id === activeId) ?? visible[0]!;
  const answer = pickAnswerForCategory(
    selected.answers as unknown as Record<string, unknown>[],
    categoryKey,
  );
  const dup =
    answer &&
    isDuplicate(categoryKey, answer.normalizedValue, answer.isValid);

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <div
        className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="بازیکنان"
      >
        {visible.map((p) => {
          const on = p.id === activeId;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setPicked(p.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
                on
                  ? "bg-primary text-white shadow-sm"
                  : "bg-secondary text-muted-foreground hover:bg-muted",
              )}
            >
              {p.displayName}
              {p.id === meRoomPlayerId ? (
                <span className="me-1 text-[10px] font-semibold opacity-90">
                  (شما)
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="text-start" dir="auto">
        <span
          className={cn(
            "font-semibold text-foreground",
            formatAnswerCellText(answer) === "—" && "text-muted-foreground",
          )}
        >
          {formatAnswerCellText(answer)}
        </span>
        {showInvalidBadge(answer) ? (
          <Badge variant="destructive" className="ms-2 mt-1 align-middle">
            نامعتبر
          </Badge>
        ) : null}
        {dup ? (
          <Badge
            variant="outline"
            className="ms-2 mt-1 align-middle border-amber-500/55 bg-amber-500/10 text-amber-800 dark:text-amber-300"
          >
            تکراری
          </Badge>
        ) : null}
        {showScores && answer ? (
          <span
            className="ms-2 font-mono text-sm font-bold text-primary"
            dir="ltr"
          >
            {faDigits(Math.max(0, answer.score))} امتیاز
          </span>
        ) : null}
      </div>
    </div>
  );
}
