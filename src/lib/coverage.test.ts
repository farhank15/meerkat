import { describe, expect, it } from 'vitest'
import { extractSpecIds, mapCoverage } from './coverage'

const SPEC_TEXT = `
| SV-SMK-01 | landing |
| SV-SMK-02 | health |
| SV-TSI-01 | formula |
| SV-COV-07 | gap |
| SV-RAT-05 | ratchet |
`

describe('extractSpecIds', () => {
  it('extracts uppercase IDs in order, de-duplicated', () => {
    expect(extractSpecIds(SPEC_TEXT)).toEqual([
      'SV-SMK-01',
      'SV-SMK-02',
      'SV-TSI-01',
      'SV-COV-07',
      'SV-RAT-05',
    ])
  })

  it('is case-sensitive — does not pick up lowercase ids', () => {
    expect(extractSpecIds('sv-smk-01 lowercase')).toEqual([])
  })
})

describe('mapCoverage — exact SPEC fixtures', () => {
  it('SV-COV-01: 67 IDs, 60 covered → 0.895522', () => {
    const specIds: string[] = []
    for (let i = 1; i <= 67; i++) specIds.push(`SV-XX-${String(i).padStart(2, '0')}`)
    const testNames: string[] = []
    for (let i = 1; i <= 60; i++) testNames.push(`SV-XX-${String(i).padStart(2, '0')} landing`)
    const r = mapCoverage(specIds, testNames)
    expect(r.total).toBe(67)
    expect(r.covered).toBe(60)
    expect(r.coverage).toBeCloseTo(60 / 67, 6) // 0.895522
    expect(r.gaps).toHaveLength(7)
  })

  it('SV-COV-04: lowercase test name does NOT match (case-sensitive)', () => {
    const r = mapCoverage(['SV-SMK-01'], ['sv-smk-01 landing'])
    expect(r.covered).toBe(0)
    expect(r.gaps).toEqual(['SV-SMK-01'])
    // the lowercase name is an orphan (carries an ID not in spec)
    expect(r.orphans).toEqual(['sv-smk-01 landing'])
  })

  it('orphan detection: test carries an ID absent from the SPEC', () => {
    const r = mapCoverage(['SV-SMK-01'], ['SV-XYZ-99 stray'])
    expect(r.orphans).toEqual(['SV-XYZ-99 stray'])
  })

  it('full coverage → 1.0, no gaps', () => {
    const r = mapCoverage(['SV-SMK-01', 'SV-SMK-02'], ['SV-SMK-01 a', 'SV-SMK-02 b'])
    expect(r.coverage).toBe(1)
    expect(r.gaps).toEqual([])
  })

  it('empty SPEC → coverage 0, no gaps', () => {
    const r = mapCoverage([], ['anything'])
    expect(r.coverage).toBe(0)
    expect(r.total).toBe(0)
  })
})
