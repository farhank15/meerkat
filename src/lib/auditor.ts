/**
 * Vacuous Auditor & Verdict-Trust Gate — pure, deterministic audit of a run.
 *
 * Answers the question TestSprite's own green check cannot: did those passes
 * assert anything? A suite can be 100% green and produce zero evidence. This
 * module classifies every testcase and issues a trust verdict with pointers to
 * the exact rows that undermine (or support) the claim.
 *
 * Every finding traces back to a row of the run's testcase index so the audit
 * is evidence-based, never narrative-based.
 */

import type { Run, TestCaseRow } from './store'

export type TrustState = 'trusted' | 'caution' | 'suspect'

export interface FailureCluster {
  /** Shared surface, taken from the failure's kind prefix. */
  label: string
  count: number
  /** The testcase names bundled under this cause. */
  names: string[]
}

/**
 * Contextual failure bundling: coalesce failed rows by their shared failure
 * kind so N raw rows read as one root cause. Messages arrive as
 * "<kind>: <hypothesis>"; rows without a kind stay honest and unreported.
 * Pure and deterministic — same rows in, same clusters out.
 */
export function clusterFailures(rows: TestCaseRow[]): FailureCluster[] {
  const groups = new Map<string, FailureCluster>()
  for (const row of rows) {
    if (row.status !== 'failed') continue
    const message = row.message ?? ''
    const colon = message.indexOf(':')
    const label = (colon > 0 ? message.slice(0, colon) : message || 'unreported').slice(0, 80)
    const bundle = groups.get(label) ?? { label, count: 0, names: [] }
    bundle.count += 1
    bundle.names.push(row.name)
    groups.set(label, bundle)
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export interface Finding {
  /** Stable topic key used by the UI for grouping. */
  kind: 'vacuous' | 'shallow' | 'orphan' | 'conflict' | 'gap'
  severity: 'high' | 'medium' | 'low'
  /** Human summary of one cluster of findings (singles are listed inline). */
  title: string
  detail: string
  /** The testcase rows (or SPEC IDs) that evidence this finding. */
  evidence: string[]
}

export interface TrustAudit {
  state: TrustState
  headline: string
  rationale: string
  findings: Finding[]
  /** Counts derived from the run itself, for the audit header. */
  counts: {
    total: number
    meaningfulPasses: number
    vacuous: number
    orphans: number
    conflicted: number
    gaps: number
    shallow: number
  }
}

const VACUOUS_HINTS = [
  /visible/i,
  /page loads/i,
  /element exists/i,
  /returns 200/i,
]

/**
 * A pass asserts something when it has an owning SPEC ID and either a
 * substantive failure surface or an assertion-bearing name. Names that only
 * restate visibility are the classic vacuous pattern.
 */
export function isVacuousRow(row: TestCaseRow): boolean {
  if (row.vacuous === true) return true
  if (row.status !== 'passed') return false
  if (row.specId) return false
  return VACUOUS_HINTS.some((h) => h.test(row.name))
}

export function auditRun(run: Run): TrustAudit {
  const rows = run.testCases ?? []

  const vacuousRows = rows.filter((r) => isVacuousRow(r))
  const orphanRows = rows.filter((r) => !r.specId && !isVacuousRow(r))
  const conflictedRows = rows.filter((r) => (r.message ?? '').includes('conflict'))

  const gaps = (run.specEntries ?? []).filter((s) => !s.covered)
  const failed = rows.filter((r) => r.status === 'failed')

  const shallowRows = (run.testCases ?? []).filter((t) => t.shallow)

  const counts = {
    total: rows.length,
    meaningfulPasses: run.meaningfulPasses,
    vacuous: run.vacuousCount || vacuousRows.length,
    orphans: orphanRows.length,
    conflicted: run.conflicted || conflictedRows.length,
    gaps: gaps.length,
    shallow: shallowRows.length,
  }

  const findings: Finding[] = []

  if (vacuousRows.length > 0) {
    findings.push({
      kind: 'vacuous',
      severity: 'high',
      title: `${vacuousRows.length} vacuous pass${vacuousRows.length > 1 ? 'es' : ''}`,
      detail:
        'Passed without asserting scenario behaviour — visible-only checks add green but no evidence, and are excluded from the pass rate.',
      evidence: vacuousRows.slice(0, 5).map((r) => r.name),
    })
  }

  if (shallowRows.length > 0) {
    findings.push({
      kind: 'shallow',
      severity: 'low',
      title: `${shallowRows.length} shallow pass${shallowRows.length > 1 ? 'es' : ''} (1 assertion)`,
      detail:
        'Passed with a single assertion step. Unlike a vacuous pass it does assert behaviour, so it counts toward the pass rate — but the gate flags it so the reader knows the coverage is thin, not rich.',
      evidence: shallowRows.slice(0, 5).map((r) => r.name),
    })
  }

  if (orphanRows.length > 0) {
    findings.push({
      kind: 'orphan',
      severity: 'medium',
      title: `${orphanRows.length} orphan testcase${orphanRows.length > 1 ? 's' : ''}`,
      detail:
        'No SPEC ID asserted. They may catch regressions by accident, but nothing guarantees they target intended behaviour.',
      evidence: orphanRows.slice(0, 5).map((r) => r.name),
    })
  }

  if (counts.conflicted > 0) {
    findings.push({
      kind: 'conflict',
      severity: 'medium',
      title: `${counts.conflicted} conflicted assertion${counts.conflicted > 1 ? 's' : ''}`,
      detail:
        'The same SPEC ID is claimed by multiple testcases — the coverage count double-counts unless resolved.',
      evidence: conflictedRows.slice(0, 5).map((r) => r.name),
    })
  }

  if (gaps.length > 0) {
    findings.push({
      kind: 'gap',
      severity: 'low',
      title: `${gaps.length} uncovered SPEC scenario${gaps.length > 1 ? 's' : ''}`,
      detail:
        'Scenarios the contract promises but no testcase asserts. Gaps are honest — they lower the score instead of faking coverage.',
      evidence: gaps.slice(0, 5).map((g) => `${g.id} (SPEC.md:${g.specLine})`),
    })
  }

  if (failed.length > 0) {
    // Failures are not findings — they are truth. But a fail-heavy run should
    // block any "trusted" narrative outright.
  }

  // Verdict-Trust Gate classification.
  let state: TrustState
  let headline: string
  let rationale: string

  if (run.verdict?.state === 'incomplete' || run.verdict?.state === 'refused') {
    state = 'caution'
    headline = 'Held — the run is incomplete, evidence is not there yet'
    rationale =
      'The run refused or did not complete. An audit of a partial run would be meaningless, so the gate withholds a verdict instead of guessing.'
  } else if (failed.length > 0) {
    state = 'caution'
    headline = 'Green cannot be claimed — real failures exist'
    rationale = `${failed.length} testcase${failed.length > 1 ? 's' : ''} failed. The gate reports failures as-is; a green badge would be a lie.`
  } else if (vacuousRows.length > 0) {
    state = 'suspect'
    headline = 'Suspect — the pass rate is inflated by vacuous checks'
    rationale = `${vacuousRows.length} pass${vacuousRows.length > 1 ? 'es' : ''} assert nothing. Excluding them, the meaningful pass total is ${run.meaningfulPasses}/${run.total}.`
  } else if (counts.conflicted > 0 || orphanRows.length > 0) {
    state = 'caution'
    headline = 'Caution — evidence exists but is not fully anchored'
    rationale =
      'Every passing check asserts behaviour, yet orphans or conflicts make the coverage claim softer than it looks.'
  } else {
    state = 'trusted'
    headline = 'Trusted — every pass asserts a contracted scenario'
    rationale = `All ${run.meaningfulPasses} meaningful passes map to SPEC IDs, no vacuous checks, no conflicts. The green verdict is backed by evidence.`
  }

  return { state, headline, rationale, findings, counts }
}
