// Coverage traceability: map SPEC.md scenario IDs against test names.
// ID matching is CASE-SENSITIVE — `sv-smk-01` does not match `SV-SMK-01`.

const SPEC_ID_RE = /SV-[A-Z]{2,4}-\d{2}/g

/** Extract SPEC scenario IDs in order, de-duplicated, case-sensitive. */
export function extractSpecIds(specText: string): string[] {
  const matches = specText.match(SPEC_ID_RE) ?? []
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of matches) {
    if (!seen.has(id)) {
      seen.add(id)
      out.push(id)
    }
  }
  return out
}

export interface CoverageResult {
  coverage: number
  covered: number
  total: number
  /** SPEC IDs with no matching test. */
  gaps: string[]
  /** Test names that carry an ID not present in the SPEC. */
  orphans: string[]
}

/**
 * Map SPEC IDs to test names. A SPEC ID is "covered" when any test name contains
 * it as a case-sensitive substring.
 */
export function mapCoverage(specIds: string[], testNames: string[]): CoverageResult {
  const specSet = new Set(specIds)
  const covered: string[] = []
  const gaps: string[] = []

  for (const id of specIds) {
    const found = testNames.some((n) => n.includes(id))
    if (found) covered.push(id)
    else gaps.push(id)
  }

  const orphans = testNames.filter((n) => {
    // Candidate ID detection is case-insensitive; the case-sensitive check
    // against specSet is what enforces COV-04 (sv-smk-01 ≠ SV-SMK-01 → orphan).
    const m = n.match(/SV-[A-Za-z]{2,4}-\d{2}/gi)
    return m ? m.some((id) => !specSet.has(id)) : false
  })

  const coverage = specIds.length === 0 ? 0 : covered.length / specIds.length
  return { coverage, covered: covered.length, total: specIds.length, gaps, orphans }
}
