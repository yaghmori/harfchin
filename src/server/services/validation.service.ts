import { validateAnswerForLetter } from "@/domain/rules/answer-validation";

export function validateAnswer(raw: string, roundLetter: string) {
  return validateAnswerForLetter(raw, roundLetter);
}
