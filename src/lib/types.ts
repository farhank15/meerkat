// Core domain types for the Meerkat scoring engine.
// Pure, framework-free types shared by the dashboard, the CLI, and the bot comment.

export type PlanStep = {
  type: 'action' | 'assertion'
  description?: string
}

export interface TsiComponents {
  /** Fraction of SPEC IDs covered, 0..1. */
  coverage: number
  /** Stability fraction, 0..1 (1.0 when fewer than 2 runs on the same SHA). */
  stability: number
  /** Meaningful pass rate, 0..1 (excludes vacuous passes). */
  passRate: number
}

export interface RunCounts {
  coveredIds: number
  totalIds: number
  conflicted: number
  tested: number
  meaningfulPasses: number
  totalTests: number
}

export type DepthLabel = 'vacuous' | 'shallow' | 'meaningful'

export type VerdictKind = 'refused' | 'incomplete' | 'spec-drift' | 'regression'

export interface VerdictInput {
  kind: VerdictKind
  /** Whether a failure bundle is available to drive auto-remediation. */
  bundleAvailable: boolean
}

export interface VerdictDecision {
  classification: string
  action: 'none' | 'test-update-needed' | 'dispatch' | 'manual'
  label: string
}
