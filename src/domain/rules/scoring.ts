export type ScoringEntry = {
  roomPlayerId: string;
  normalized: string;
  isValid: boolean;
};

export type CategoryScoreConfig = {
  pointsSoloBonus: number;
  pointsUnique: number;
  pointsDuplicate: number;
};

/**
 * Uses per-category point values.
 *
 * - Invalid or empty → 0 for that player.
 * - Exactly one valid answer in the category (everyone else empty/invalid) → solo bonus.
 * - Two or more valid answers: group by normalized text; singleton groups → unique points;
 *   groups of 2+ → duplicate points for each player in the group.
 */
export function scoreCategoryAnswers(
  entries: ScoringEntry[],
  config: CategoryScoreConfig,
): Map<string, number> {
  const scores = new Map<string, number>();
  for (const e of entries) {
    scores.set(e.roomPlayerId, 0);
  }

  const valid = entries.filter((e) => e.isValid && e.normalized !== "");

  if (valid.length === 0) {
    return scores;
  }

  if (valid.length === 1) {
    scores.set(valid[0].roomPlayerId, config.pointsSoloBonus);
    return scores;
  }

  const byNorm = new Map<string, string[]>();
  for (const e of valid) {
    const list = byNorm.get(e.normalized) ?? [];
    list.push(e.roomPlayerId);
    byNorm.set(e.normalized, list);
  }

  for (const ids of byNorm.values()) {
    const pts = ids.length === 1 ? config.pointsUnique : config.pointsDuplicate;
    for (const id of ids) {
      scores.set(id, pts);
    }
  }

  return scores;
}
