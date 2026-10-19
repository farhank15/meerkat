import { describe, expect, it } from 'vitest'
import { scoreFromArtifacts } from './scoreCmd'

const SPEC = `
# SPEC.md
- SV-SMK-01 landing renders
- SV-XX-01 auth flow
- SV-XX-02 dashboard loads
`

const JUNIT_ALL_PASS = `
<testsuites>
  <testsuite name="s">
    <testcase name="SV-SMK-01 landing renders"/>
    <testcase name="SV-XX-01 auth flow"/>
    <testcase name="SV-XX-02 dashboard loads"/>
  </testsuite>
</testsuites>
`

const JUNIT_WITH_GAP = `
<testsuites>
  <testsuite name="s">
    <testcase name="SV-SMK-01 landing renders"/>
    <testcase name="SV-XX-02 dashboard loads"/>
    <testcase name="SV-XX-03 missing"/>
  </testsuite>
</testsuites>
`

describe('scoreFromArtifacts', () => {
  it('scores a fully-covered, all-passing run', () => {
    const r = scoreFromArtifacts(JUNIT_ALL_PASS, SPEC)
    expect(r.coverage).toBe(1)
    expect(r.pass_rate).toBe(1)
    expect(r.stability).toBe(1)
    expect(r.gaps).toEqual([])
    expect(r.tsi).toBe(100)
  })

  it('reports coverage gaps for untested SPEC IDs', () => {
    const r = scoreFromArtifacts(JUNIT_WITH_GAP, SPEC)
    // SV-XX-01 is in SPEC but has no matching test name.
    expect(r.gaps).toContain('SV-XX-01')
    expect(r.coverage).toBeCloseTo(2 / 3)
  })

  it('is deterministic — same input, same output', () => {
    const a = scoreFromArtifacts(JUNIT_WITH_GAP, SPEC)
    const b = scoreFromArtifacts(JUNIT_WITH_GAP, SPEC)
    expect(a).toEqual(b)
  })

  it('counts failures against pass rate', () => {
    const junit = `
<testsuites><testsuite name="s">
  <testcase name="SV-SMK-01 landing renders"/>
  <testcase name="SV-XX-01 auth flow"><failure/></testcase>
  <testcase name="SV-XX-02 dashboard loads"/>
</testsuite></testsuites>`
    const r = scoreFromArtifacts(junit, SPEC)
    expect(r.passed).toBe(2)
    expect(r.failed).toBe(1)
    expect(r.pass_rate).toBeCloseTo(2 / 3)
  })
})
