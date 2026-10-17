import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { roundHalfAwayFromZero, computeTsi, tsiFromCounts } from './tsi'
import { assertionCount, classifyDepth, isMeaningful } from './assertionDepth'
import { classifyVerdict } from './classifier'
import type { PlanStep } from './types'

describe('roundHalfAwayFromZero', () => {
  it('rounds the TSI fixture boundaries exactly', () => {
    expect(roundHalfAwayFromZero(95.4999)).toBe(95)
    expect(roundHalfAwayFromZero(95.5)).toBe(96)
    expect(roundHalfAwayFromZero(-1234.5)).toBe(-1235)
  })

  it('is deterministic', () => {
    expect(roundHalfAwayFromZero(93.1343283)).toBe(roundHalfAwayFromZero(93.1343283))
  })
})

describe('computeTsi — exact SPEC fixtures', () => {
  it('SV-TSI-01 primary fixture → 93', () => {
    const tsi = computeTsi({
      coverage: 60 / 67,
      stability: 66 / 67,
      passRate: 63 / 67,
    })
    expect(tsi).toBe(93)
  })

  it('all perfect → 100', () => {
    expect(computeTsi({ coverage: 1, stability: 1, passRate: 1 })).toBe(100)
  })

  it('all zero → 0', () => {
    expect(computeTsi({ coverage: 0, stability: 0, passRate: 0 })).toBe(0)
  })

  it('pass_rate 1.0 but coverage 0.0 → 50 (not an exception)', () => {
    // F5.5: 0.30*1.0 + 0.20*1.0 = 0.50 → 50
    expect(computeTsi({ coverage: 0, stability: 1, passRate: 1 })).toBe(50)
  })

  it('empty SPEC renormalises without coverage → 100', () => {
    expect(computeTsi({ coverage: 0, stability: 1, passRate: 1 }, { specEmpty: true })).toBe(100)
  })
})

describe('tsiFromCounts', () => {
  it('derives SV-TSI-01 from raw counts', () => {
    const tsi = tsiFromCounts({
      coveredIds: 60,
      totalIds: 67,
      conflicted: 1,
      tested: 67,
      meaningfulPasses: 63,
      totalTests: 67,
    })
    expect(tsi).toBe(93)
  })

  it('fewer than 2 runs → stability estimated 1.0', () => {
    const tsi = tsiFromCounts({
      coveredIds: 67,
      totalIds: 67,
      conflicted: 0,
      tested: 1,
      meaningfulPasses: 67,
      totalTests: 67,
    })
    expect(tsi).toBe(100)
  })
})

describe('TSI property: stays within [0,100]', () => {
  it('any normalised inputs → 0..100', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (coverage, stability, passRate) => {
          const tsi = computeTsi({ coverage, stability, passRate })
          expect(tsi).toBeGreaterThanOrEqual(0)
          expect(tsi).toBeLessThanOrEqual(100)
        },
      ),
    )
  })
})

describe('assertionDepth', () => {
  const steps = (n: number): PlanStep[] =>
    Array.from({ length: n }, () => ({ type: 'assertion' }))

  it('vacuous when 0 assertions', () => {
    expect(classifyDepth(steps(0))).toBe('vacuous')
    expect(assertionCount(steps(0))).toBe(0)
  })

  it('shallow when exactly 1 assertion', () => {
    expect(classifyDepth(steps(1))).toBe('shallow')
  })

  it('meaningful when 2+ assertions', () => {
    expect(classifyDepth(steps(5))).toBe('meaningful')
  })

  it('isMeaningful excludes vacuous passes (F22.2)', () => {
    expect(isMeaningful(true, steps(0))).toBe(false)
    expect(isMeaningful(true, steps(1))).toBe(true)
    expect(isMeaningful(false, steps(3))).toBe(false)
  })
})

describe('classifier — verdict-trust decision table', () => {
  it('refused → no action', () => {
    expect(classifyVerdict({ kind: 'refused', bundleAvailable: false })).toEqual({
      classification: 'refused',
      action: 'none',
      label: 'refused (not a failure)',
    })
  })

  it('incomplete → no action', () => {
    expect(classifyVerdict({ kind: 'incomplete', bundleAvailable: false }).action).toBe('none')
  })

  it('spec-drift → test-update-needed, code untouched', () => {
    const d = classifyVerdict({ kind: 'spec-drift', bundleAvailable: true })
    expect(d.action).toBe('test-update-needed')
    expect(d.label).toBe('spec-drift — test update needed')
  })

  it('regression + bundle → dispatch (F20.1)', () => {
    expect(classifyVerdict({ kind: 'regression', bundleAvailable: true }).action).toBe('dispatch')
  })

  it('regression, no bundle → manual loop', () => {
    expect(classifyVerdict({ kind: 'regression', bundleAvailable: false }).action).toBe('manual')
  })

  it('is deterministic for identical input', () => {
    const a = classifyVerdict({ kind: 'regression', bundleAvailable: true })
    const b = classifyVerdict({ kind: 'regression', bundleAvailable: true })
    expect(a).toEqual(b)
  })
})
