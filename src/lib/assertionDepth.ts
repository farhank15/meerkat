import type { DepthLabel, PlanStep } from './types'

/** Count plan steps whose type is 'assertion'. */
export function assertionCount(steps: PlanStep[]): number {
  return steps.filter((s) => s.type === 'assertion').length
}

/**
 * Classify a test's assertion depth:
 * - 'vacuous'  : 0 assertions (passes without asserting anything)
 * - 'shallow'  : exactly 1 assertion (a signal, not a penalty)
 * - 'meaningful': 2 or more assertions
 */
export function classifyDepth(steps: PlanStep[]): DepthLabel {
  const a = assertionCount(steps)
  if (a === 0) return 'vacuous'
  if (a === 1) return 'shallow'
  return 'meaningful'
}

/**
 * A pass is "meaningful" when it passed AND asserted at least once.
 * A vacuous pass (0 assertions) is excluded from the pass rate.
 */
export function isMeaningful(passed: boolean, steps: PlanStep[]): boolean {
  return passed && assertionCount(steps) >= 1
}
