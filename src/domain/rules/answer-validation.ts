import { MAX_ANSWER_LENGTH } from "@/lib/constants";
import { normalizePersian, startsWithPersianLetter } from "./persian-normalize";

export type AnswerValidationResult = {
  normalized: string;
  isValid: boolean;
};

/**
 * MVP: non-empty after normalize, max length, must start with round letter (normalized).
 */
export function validateAnswerForLetter(
  raw: string,
  roundLetter: string,
): AnswerValidationResult {
  const normalized = normalizePersian(raw);
  if (normalized.length === 0) {
    return { normalized: "", isValid: false };
  }
  if (normalized.length > MAX_ANSWER_LENGTH) {
    return { normalized, isValid: false };
  }
  if (!startsWithPersianLetter(normalized, roundLetter)) {
    return { normalized, isValid: false };
  }
  return { normalized, isValid: true };
}
