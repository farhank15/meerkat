// Pure scoring composition used by the `suitevitals score` CLI. Kept framework-
// free so it is trivially unit-testable and shares the dashboard's engine.

import { parseJUnit } from './junit'
import { extractSpecIds, mapCoverage } from './coverage'
import { tsiFromCounts } from './tsi'
import type { RunCounts } from './types'

export interface ScoreResult {
  tsi: number
  coverage: number
  stability: number
  pass_rate: number
  total: number
  passed: number
  failed: number
  skipped: number
  gaps: string[]
  orphans: string[]
}

/**
 * Score a TestSprite JUnit result against a SPEC.md scenario contract.
 * Deterministic: identical inputs always yield identical output.
 *
 * Raw JUnit has no conflict/vacuous-pass signal, so stability is reported as the
 * estimated 1.0 and every non-skipped pass counts as meaningful — the same
 * fallback the engine uses for single-run scoring.
 */
export function scoreFromArtifacts(junitXml: string, specText: string): ScoreResult {
  const junit = parseJUnit(junitXml)
  const specIds = extractSpecIds(specText)
  const cov = mapCoverage(specIds, junit.names)

  const counts: RunCounts = {
    coveredIds: cov.covered,
    totalIds: cov.total,
    conflicted: 0,
    tested: junit.total,
    meaningfulPasses: junit.passed,
    totalTests: junit.total,
  }
  const tsi = tsiFromCounts(counts)

  return {
    tsi,
    coverage: cov.coverage,
    stability: counts.tested < 2 ? 1.0 : 1 - counts.conflicted / counts.tested,
    pass_rate: junit.total === 0 ? 0 : junit.passed / junit.total,
    total: junit.total,
    passed: junit.passed,
    failed: junit.failed,
    skipped: junit.skipped,
    gaps: cov.gaps,
    orphans: cov.orphans,
  }
}
