import type { ZodIssue } from "zod";

/**
 * Maps Zod issues to a flat record (first message per mapped field key).
 * Use `pathKeyMap` when API/schema paths differ from form field ids (e.g. email → identifier).
 */
export function fieldErrorsFromZodIssues(
  issues: ZodIssue[],
  pathKeyMap?: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const raw = issue.path[0];
    const from = typeof raw === "string" ? raw : String(raw ?? "");
    const key = (from && pathKeyMap?.[from]) || from;
    if (key && out[key] === undefined) out[key] = issue.message;
  }
  return out;
}
