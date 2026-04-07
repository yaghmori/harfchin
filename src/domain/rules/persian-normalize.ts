import { normalizePersianText } from "./persian-text";

/**
 * Full pipeline: Arabic variants → Persian, trim, collapse spaces.
 */
export function normalizePersian(input: string): string {
  return normalizePersianText(input);
}

/**
 * First user-perceived grapheme (Persian locale when available).
 */
export function firstGrapheme(input: string): string {
  const s = normalizePersian(input);
  if (!s) return "";
  try {
    const seg = new Intl.Segmenter("fa", { granularity: "grapheme" });
    for (const { segment } of seg.segment(s)) {
      return normalizePersianText(segment);
    }
  } catch {
    // Intl.Segmenter may be missing in some runtimes
  }
  const chars = Array.from(s);
  return chars.length > 0 ? normalizePersianText(chars[0]!) : "";
}

export function startsWithPersianLetter(
  normalizedAnswer: string,
  normalizedLetter: string,
): boolean {
  const first = firstGrapheme(normalizedAnswer);
  const letter = normalizePersianText(normalizedLetter);
  return first !== "" && letter !== "" && first === letter;
}
