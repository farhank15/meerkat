import { XMLParser } from 'fast-xml-parser'

export type JUnitStatus = 'passed' | 'failed' | 'skipped'

export interface JUnitCase {
  name: string
  status: JUnitStatus
  /** Message reported by the runner for a failure or error, when present. */
  message?: string
  /** Duration in seconds, when the runner reported one. */
  time?: number
}

export interface JUnitResult {
  total: number
  passed: number
  failed: number
  skipped: number
  /** Testcases in document order, with their individual verdict. */
  cases: JUnitCase[]
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

/** fast-xml-parser represents `<failure message="x">text</failure>` either as a
 * string or as an object with `@_message` / `#text`. Accept both. */
function failureMessage(node: unknown): string | undefined {
  if (typeof node === 'string') return node || undefined
  if (node && typeof node === 'object') {
    const rec = node as Record<string, unknown>
    if (typeof rec['@_message'] === 'string') return rec['@_message']
    if (typeof rec['#text'] === 'string') return rec['#text']
  }
  return undefined
}

function duration(node: Record<string, unknown>): number | undefined {
  const raw = node['@_time']
  if (typeof raw !== 'string' && typeof raw !== 'number') return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

/**
 * Parse a JUnit XML report into aggregate counts plus per-testcase verdicts.
 *
 * - Multiple <testsuite> elements are accumulated, never double-counted.
 * - A <skipped/> testcase counts toward `total` (it is not a pass).
 * - A <failure> or <error> keeps its message so the UI can show why it failed.
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
  const cases: JUnitCase[] = []

  for (const suite of suites) {
    for (const c of toArray<Record<string, unknown>>(suite.testcase)) {
      total++
      const name = typeof c['@_name'] === 'string' ? c['@_name'] : ''
      const time = duration(c)

      if (c.skipped !== undefined) {
        skipped++
        cases.push({ name, status: 'skipped', time })
        continue
      }

      if (c.failure !== undefined || c.error !== undefined) {
        failed++
        cases.push({
          name,
          status: 'failed',
          message: failureMessage(c.failure ?? c.error),
          time,
        })
        continue
      }

      passed++
      cases.push({ name, status: 'passed', time })
    }
  }

  return { total, passed, failed, skipped, cases }
}
