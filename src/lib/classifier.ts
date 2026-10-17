import type { VerdictDecision, VerdictInput } from './types'

/**
 * Verdict-trust decision table (F18 / F19 / F20). Pure and deterministic: the
 * classification — and therefore whether an agent is dispatched — never depends
 * on time or randomness. Only the dispatch itself may be non-deterministic.
 *
 * - refused / incomplete  → never touch code (not a real failure)
 * - spec-drift            → update test/spec, not application code
 * - regression + bundle   → dispatch a fix agent
 * - regression, no bundle → manual loop
 */
export function classifyVerdict(input: VerdictInput): VerdictDecision {
  switch (input.kind) {
    case 'refused':
      return { classification: 'refused', action: 'none', label: 'refused (not a failure)' }
    case 'incomplete':
      return { classification: 'incomplete', action: 'none', label: 'incomplete rerun refused' }
    case 'spec-drift':
      return {
        classification: 'spec-drift',
        action: 'test-update-needed',
        label: 'spec-drift — test update needed',
      }
    case 'regression':
      return input.bundleAvailable
        ? { classification: 'regression', action: 'dispatch', label: 'regression — fix proposed' }
        : { classification: 'regression', action: 'manual', label: 'no bundle — manual loop' }
  }
}
