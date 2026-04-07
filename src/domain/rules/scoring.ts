export type ScoringEntry = {
  roomPlayerId: string;
  normalized: string;
  isValid: boolean;
};

/**
 * Per category: empty/invalid → 0; valid unique → 10; valid duplicate → 5 for each in group.
 */
export function scoreCategoryAnswers(entries: ScoringEntry[]): Map<string, number> {
  const scores = new Map<string, number>();
  for (const e of entries) {
    scores.set(e.roomPlayerId, 0);
  }

  const byNorm = new Map<string, string[]>();
  for (const e of entries) {
    if (!e.isValid || e.normalized === "") continue;
    const list = byNorm.get(e.normalized) ?? [];
    list.push(e.roomPlayerId);
    byNorm.set(e.normalized, list);
  }

  for (const ids of byNorm.values()) {
    const pts = ids.length === 1 ? 10 : 5;
    for (const id of ids) {
      scores.set(id, pts);
    }
  }

  return scores;
}
