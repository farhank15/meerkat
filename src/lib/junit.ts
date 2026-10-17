import { XMLParser } from 'fast-xml-parser'

export interface JUnitResult {
  total: number
  passed: number
  failed: number
  skipped: number
  /** Testcase names in document order. */
  names: string[]
}

const parser = new XMLParser({ ignoreAttributes: false })

/** Shape of the parsed XML root. `testsuites` may wrap one or many `testsuite`
 * elements; both forms are accepted. */
interface JUnitRoot {
  testsuites?: { testsuite?: unknown }
  testsuite?: unknown
}

function toArray<T>(value: unknown): T[] {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? (value as T[]) : [value as T]
}

/**
 * Parse a JUnit XML report into aggregate counts.
 *
 * - Multiple <testsuite> elements are accumulated, never double-counted.
 * - A <skipped/> testcase counts toward `total` (it is not a pass).
 * - Malformed input throws an Error with message 'parse-error'.
 */
export function parseJUnit(xml: string): JUnitResult {
  let doc: unknown
  try {
    doc = parser.parse(xml)
  } catch {
    throw new Error('parse-error')
  }

  const root = doc as JUnitRoot
  const suites = toArray<Record<string, unknown>>(
    root.testsuites?.testsuite ?? root.testsuite,
  )
  if (suites.length === 0) {
    throw new Error('parse-error')
  }

  let total = 0
  let passed = 0
  let failed = 0
  let skipped = 0
  const names: string[] = []

  for (const suite of suites) {
    const cases = toArray<Record<string, unknown>>(suite.testcase)
    for (const c of cases) {
      total++
      const name = typeof c['@_name'] === 'string' ? c['@_name'] : ''
      names.push(name)
      if (c.skipped !== undefined) {
        skipped++
      } else if (c.failure !== undefined || c.error !== undefined) {
        failed++
      } else {
        passed++
      }
    }
  }

  return { total, passed, failed, skipped, names }
}
