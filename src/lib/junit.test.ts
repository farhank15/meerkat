import { describe, expect, it } from 'vitest'
import { parseJUnit } from './junit'

/** Build a JUnit string with exact pass/fail/skip counts. */
function buildJUnit(pass: number, fail: number, skip: number): string {
  let cases = ''
  let i = 0
  for (let p = 0; p < pass; p++) cases += `<testcase name="SV-ING-${++i}" classname="t"/>`
  for (let f = 0; f < fail; f++)
    cases += `<testcase name="SV-TSI-${++i}" classname="t"><failure message="x"/></testcase>`
  for (let s = 0; s < skip; s++)
    cases += `<testcase name="SV-COV-${++i}" classname="t"><skipped/></testcase>`
  const total = pass + fail + skip
  return `<testsuites><testsuite name="s" tests="${total}" failures="${fail}" skipped="${skip}">${cases}</testsuite></testsuites>`
}

describe('parseJUnit — exact SPEC fixtures', () => {
  it('SV-ING-01: 67 testcases (64 pass, 3 fail, 0 skip)', () => {
    const r = parseJUnit(buildJUnit(64, 3, 0))
    expect(r).toEqual({ total: 67, passed: 64, failed: 3, skipped: 0, names: expect.any(Array) })
    expect(r.names).toHaveLength(67)
  })

  it('SV-ING-02: 10 testcases, 2 skipped → pass rate 6/10 = 0.60 (not 6/8)', () => {
    const r = parseJUnit(buildJUnit(6, 2, 2))
    expect(r.total).toBe(10)
    expect(r.passed).toBe(6)
    expect(r.failed).toBe(2)
    expect(r.skipped).toBe(2)
  })

  it('multiple <testsuite> elements accumulate, never double-count', () => {
    const xml = `<testsuites>
      <testsuite name="a" tests="2" failures="0"><testcase name="SV-SMK-01"/><testcase name="SV-SMK-02"/></testsuite>
      <testsuite name="b" tests="1" failures="1"><testcase name="SV-TSI-01"><failure/></testcase></testsuite>
    </testsuites>`
    const r = parseJUnit(xml)
    expect(r.total).toBe(3)
    expect(r.passed).toBe(2)
    expect(r.failed).toBe(1)
  })

  it('malformed XML → throws "parse-error" (SV-ING-04)', () => {
    expect(() => parseJUnit('<testsuite><testcase')).toThrow('parse-error')
  })

  it('empty / structure-less input → throws "parse-error"', () => {
    expect(() => parseJUnit('<notajunit/>')).toThrow('parse-error')
  })
})
