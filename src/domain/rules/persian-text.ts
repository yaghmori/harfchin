/**
 * Maps common Arabic presentation forms to Persian; ی/ک unification; whitespace cleanup.
 */
export function normalizePersianText(input: string): string {
  const s = input.normalize("NFC");
  const map: Record<string, string> = {
    ي: "ی",
    ى: "ی",
    ئ: "ی",
    ك: "ک",
    "\u0640": "", // tatweel
    "\u200c": "", // ZWNJ — strip for comparison MVP
    "\u200d": "",
  };
  let out = "";
  for (const ch of s) {
    out += map[ch] ?? ch;
  }
  out = out.replace(/\s+/g, " ").trim();
  return out;
}
