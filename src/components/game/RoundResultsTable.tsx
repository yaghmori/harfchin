"use client";

import { Badge } from "@/components/ui/badge";
import type { TabPlayer } from "@/components/game/CategoryPlayerTabs";
import {
  formatAnswerCellText,
  pickAnswerForCategory,
  showInvalidBadge,
} from "@/components/game/round-answer-utils";
import { faDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

type RoundResultsTableProps = {
  categories: { key: string; title: string }[];
  players: TabPlayer[];
  meRoomPlayerId: string | null;
  isDuplicate: (
    categoryKey: string,
    normalizedValue: string,
    isValid: boolean,
  ) => boolean;
};

export function RoundResultsTable({
  categories,
  players,
  meRoomPlayerId,
  isDuplicate,
}: RoundResultsTableProps) {
  const orderedPlayers = useMemo(() => {
    const me = players.filter((p) => p.id === meRoomPlayerId);
    const rest = players
      .filter((p) => p.id !== meRoomPlayerId)
      .sort((a, b) =>
        a.displayName.localeCompare(b.displayName, "fa", {
          sensitivity: "base",
        }),
      );
    return [...me, ...rest];
  }, [players, meRoomPlayerId]);

  if (orderedPlayers.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground" dir="rtl">
        بازیکنی ثبت نشده است.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60" dir="rtl">
      <table className="w-full min-w-[520px] border-collapse text-right text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/40">
            <th
              scope="col"
              className="sticky end-0 z-20 min-w-[7rem] border-border/60 border-e bg-muted/40 px-3 py-2.5 text-xs font-bold text-muted-foreground backdrop-blur-sm"
            >
              دسته
            </th>
            {orderedPlayers.map((p) => (
              <th
                key={p.id}
                scope="col"
                className="min-w-[8.5rem] px-2 py-2.5 text-xs font-bold text-foreground"
              >
                <span className="line-clamp-2">{p.displayName || "بازیکن"}</span>
                {p.id === meRoomPlayerId ? (
                  <span className="mt-0.5 block text-[10px] font-semibold text-primary">
                    شما
                  </span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr
              key={c.key}
              className="border-b border-border/40 last:border-b-0 odd:bg-background even:bg-muted/15"
            >
              <th
                scope="row"
                className="sticky end-0 z-10 border-border/60 border-e bg-card px-3 py-2.5 text-xs font-bold text-muted-foreground shadow-[inset_-1px_0_0_0_var(--color-border)]"
              >
                {c.title}
              </th>
              {orderedPlayers.map((p) => {
                const answer = pickAnswerForCategory(
                  p.answers as unknown as Record<string, unknown>[],
                  c.key,
                );
                const text = formatAnswerCellText(answer);
                const invalid = showInvalidBadge(answer);
                const dup =
                  answer &&
                  answer.isValid &&
                  isDuplicate(c.key, answer.normalizedValue, answer.isValid);
                const score =
                  answer != null ? faDigits(Math.max(0, answer.score)) : "—";

                return (
                  <td
                    key={p.id}
                    className="align-top px-2 py-2.5 text-start"
                    dir="auto"
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <span
                        className={cn(
                          "font-semibold text-foreground",
                          text === "—" && "text-muted-foreground",
                        )}
                      >
                        {text}
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        {invalid ? (
                          <Badge
                            variant="destructive"
                            className="text-[10px] font-bold"
                          >
                            نامعتبر
                          </Badge>
                        ) : null}
                        {dup ? (
                          <Badge
                            variant="outline"
                            className="border-amber-500/55 bg-amber-500/10 text-[10px] font-bold text-amber-800 dark:text-amber-300"
                          >
                            تکراری
                          </Badge>
                        ) : null}
                        <span
                          className="font-mono text-xs font-bold text-primary"
                          dir="ltr"
                        >
                          {score !== "—" ? `${score} امتیاز` : null}
                        </span>
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
