import { describe, expect, it } from 'vitest'
import { parseJUnit } from './junit'
import junitXml from './fixtures/testsprite-junit.xml?raw'
import { DEMO_RUN } from './store'

describe('demo JUnit artifact', () => {
  const parsed = parseJUnit(junitXml)

  it('holds 67 testcases: 64 passed, 3 failed, 0 skipped', () => {
    expect(parsed).toMatchObject({ total: 67, passed: 64, failed: 3, skipped: 0 })
  })

  it('keeps a message for every failed testcase', () => {
    const failed = parsed.cases.filter((c) => c.status === 'failed')
    expect(failed).toHaveLength(3)
    for (const c of failed) {
      expect(c.message, `${c.name} has no failure message`).toBeTruthy()
    }
  })

  it('carries 7 orphan tests that assert no SPEC ID', () => {
    const orphans = DEMO_RUN.testCases.filter((t) => t.specId === null)
    expect(orphans).toHaveLength(7)
    expect(DEMO_RUN.testCases).toHaveLength(67)
  })
})

describe('run built from the artifact', () => {
  it('derives the counts from the artifact, not from hard-coded numbers', () => {
    expect(DEMO_RUN.total).toBe(67)
    expect(DEMO_RUN.passed).toBe(64)
    expect(DEMO_RUN.failed).toBe(3)
    expect(DEMO_RUN.skipped).toBe(0)
  })

  it('keeps coverage at 60/67 and the fixture TSI at 93', () => {
    expect(DEMO_RUN.coverageIdsCovered).toBe(60)
    expect(DEMO_RUN.coverageIdsTotal).toBe(67)
    expect(DEMO_RUN.metric.tsi).toBe(93)
  })

  it('excludes exactly one vacuous pass from the meaningful pass rate', () => {
    expect(DEMO_RUN.vacuousCount).toBe(1)
    expect(DEMO_RUN.meaningfulPasses).toBe(63)
  })

  it('exposes the 3 failed testcases as failed spec rows with a reason', () => {
    const failed = DEMO_RUN.specEntries.filter((s) => s.status === 'failed')
    expect(failed).toHaveLength(3)
    for (const s of failed) {
      expect(s.covered).toBe(true)
      expect(s.failureMessage).toBeTruthy()
    }
  })

  it('marks the 7 uncovered SPEC IDs as gaps with no testcase', () => {
    const gaps = DEMO_RUN.specEntries.filter((s) => !s.covered)
    expect(gaps).toHaveLength(7)
    for (const g of gaps) expect(g.testName).toBeNull()
  })
})
