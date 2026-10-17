import type { RunCounts, TsiComponents } from './types'

/**
 * Round half away from zero. JavaScript's Math.round rounds halves toward +Infinity,
 * which for negatives is toward zero — not what we want. A tiny epsilon guards
 * against binary-float midpoint drift (e.g. 95.5 represented as 95.49999999999999).
 */
export function roundHalfAwayFromZero(x: number): number {
  const sign = x < 0 ? -1 : 1
  const mag = Math.abs(x)
  return sign * Math.round(mag + 1e-9)
}

/**
 * Compute the Test Strength Index from already-normalised components.
 * When the SPEC is empty (no IDs), coverage is dropped and the remaining
 * weights are renormalised to 0.60 (stability) + 0.40 (pass rate).
 */
export function computeTsi(c: TsiComponents, opts?: { specEmpty?: boolean }): number {
  const specEmpty = opts?.specEmpty ?? false
  const raw = specEmpty
    ? 0.6 * c.stability + 0.4 * c.passRate
    : 0.5 * c.coverage + 0.3 * c.stability + 0.2 * c.passRate
  return roundHalfAwayFromZero(100 * raw)
}

/**
 * Derive TSI directly from raw run counts. Stability falls back to 1.0 (labelled
 * "estimated") when fewer than two runs share the same SHA.
 */
export function tsiFromCounts(r: RunCounts): number {
  const specEmpty = r.totalIds === 0
  const coverage = specEmpty ? 0 : r.coveredIds / r.totalIds
  const stability = r.tested < 2 ? 1.0 : 1 - r.conflicted / r.tested
  const passRate = r.totalTests === 0 ? 0 : r.meaningfulPasses / r.totalTests
  return computeTsi({ coverage, stability, passRate }, { specEmpty })
}
