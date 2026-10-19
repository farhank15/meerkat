/** Minimal class combiner — no dependency, no merge heuristics. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
