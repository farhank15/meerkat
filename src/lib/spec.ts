// SPEC.md is the suite contract: every score the dashboard shows must trace back
// to a scenario row in that file. Parsing it here — instead of hard-coding IDs —
// keeps the gap trace honest: a gap can only link to a line that really exists.

export interface SpecScenario {
  /** Scenario ID, e.g. `SV-TSI-01`. */
  id: string
  /** 1-based line number of the scenario row in SPEC.md. */
  line: number
  /** What the scenario asserts (the second table column). */
  asserts: string
  /** The exact expected value (the third table column). */
  exact: string
}

const ROW_RE = /^\|\s*`(SV-[A-Z]{2,4}-\d{2})`\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$/

/**
 * Extract scenario rows from the SPEC.md markdown tables, in file order.
 * Only table rows count: prose mentions of an ID are not scenario definitions.
 */
export function parseSpec(markdown: string): SpecScenario[] {
  const out: SpecScenario[] = []
  const seen = new Set<string>()
  const lines = markdown.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(ROW_RE)
    if (!match) continue
    const [, id, asserts, exact] = match
    if (seen.has(id)) continue
    seen.add(id)
    out.push({ id, line: i + 1, asserts, exact })
  }

  return out
}
