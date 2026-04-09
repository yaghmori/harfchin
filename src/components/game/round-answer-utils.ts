export type NormalizedRoundAnswer = {
  categoryKey: string;
  value: string;
  normalizedValue: string;
  isValid: boolean;
  score: number;
};

type RawAnswer = Record<string, unknown>;

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return String(v);
}

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  const n = Number.parseInt(str(v), 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Picks the answer row for a category and normalizes common API/shape variants.
 */
export function pickAnswerForCategory(
  answers: RawAnswer[] | undefined | null,
  categoryKey: string,
): NormalizedRoundAnswer | null {
  if (!answers?.length) return null;
  const a = answers.find(
    (x) =>
      str(x.categoryKey) === categoryKey || str(x.category_key) === categoryKey,
  );
  if (!a) return null;

  const value = str(a.value ?? a.text);
  const normalizedValue = str(
    a.normalizedValue ?? a.normalized_value ?? value,
  );
  const isValid = Boolean(a.isValid ?? a.is_valid);
  const score = num(a.score ?? a.points);

  return {
    categoryKey: str(a.categoryKey ?? a.category_key) || categoryKey,
    value,
    normalizedValue,
    isValid,
    score,
  };
}

export function formatAnswerCellText(answer: NormalizedRoundAnswer | null): string {
  const t = answer?.value?.trim() ?? "";
  return t.length > 0 ? t : "—";
}

export function showInvalidBadge(answer: NormalizedRoundAnswer | null): boolean {
  if (!answer) return false;
  const t = answer.value.trim();
  return t.length > 0 && !answer.isValid;
}
