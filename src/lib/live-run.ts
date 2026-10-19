// A live CI-ingested run is stored with its Run-shaped payload verbatim in the
// runs.data JSONB column. Rebuild the dashboard Run view from a row so live CI
// runs deep-link into the same detail/coverage pages as the fixture evidence.
//
// Server-only boundary: the DB read lives in a server function so the postgres
// client never enters the client bundle; route loaders call it isomorphically.

import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { runs as runsTable } from '@/db/schema'
import { DEMO_PROJECT, type Run, type TestCaseRow } from '@/lib/store'

export const loadLiveRun = createServerFn({ method: 'GET' })
  .validator((id: unknown) => typeof id === 'string' && id.length > 0 ? id : '')
  .handler(async ({ data: id }): Promise<Run | null> => {
    if (!id) return null
    try {
      const db = getDb()
      if (!db) return null
      const [row] = await db
        .select({
          id: runsTable.id,
          source: runsTable.source,
          sha: runsTable.sha,
          pr: runsTable.pr,
          branch: runsTable.branch,
          data: runsTable.data,
        })
        .from(runsTable)
        .where(eq(runsTable.id, id))
        .limit(1)
      if (!row || !row.data || typeof row.data !== 'object') return null
      return rowToRun(
        {
          id: row.id,
          source: row.source,
          sha: row.sha,
          pr: row.pr,
          branch: row.branch,
          data: row.data as Record<string, unknown>,
        },
      )
    } catch {
      // Database unavailable or id is not a live run: caller falls back to not-found.
      return null
    }
  })

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function rowToRun(row: { id: string; source: string; sha: string | null; pr: string | null; branch: string | null; data: Record<string, unknown> }): Run {
  const d = row.data
  const rawCases = Array.isArray(d.testCases) ? d.testCases : []
  const testCases = rawCases.map((t) => {
    const cell = (t ?? {}) as Record<string, unknown>
    const tc: TestCaseRow = {
      name: typeof cell.name === 'string' ? cell.name : 'unknown',
      specId: typeof cell.specId === 'string' ? cell.specId : null,
      status: cell.status === 'failed' || cell.status === 'skipped' ? cell.status : 'passed',
      ...(typeof cell.message === 'string' && cell.message ? { message: cell.message } : {}),
    }
    return tc
  })
  const metric = (d.metric ?? {}) as Record<string, unknown>
  const verdict = (d.verdict ?? undefined) as Run['verdict']

  return {
    id: row.id,
    projectId: DEMO_PROJECT.id,
    sha: row.sha ?? '',
    pr: row.pr ?? '—',
    branch: row.branch ?? '—',
    environment: row.source,
    resolvedUrl: typeof (d.targetUrl as string) === 'string' ? (d.targetUrl as string) : '',
    context: 'CI ingested',
    total: num(d.total),
    passed: num(d.passed),
    failed: num(d.failed),
    skipped: 0,
    meaningfulPasses: num(d.meaningfulPasses, num(d.passed)),
    vacuousCount: num(d.vacuousCount),
    conflicted: num(d.conflicted),
    tested: num(d.tested, num(d.total)),
    coverageIdsTotal: num(d.coverageIdsTotal),
    coverageIdsCovered: num(d.coverageIdsCovered),
    metric: {
      tsi: num(metric.tsi),
      coverage: num(metric.coverage),
      stability: num(metric.stability),
      passRate: num(metric.passRate),
    },
    status: typeof d.status === 'string' ? d.status : 'complete',
    createdAt: typeof d.startedAt === 'string' ? d.startedAt : new Date().toISOString(),
    specEntries: Array.isArray(d.specEntries) ? (d.specEntries as Run['specEntries']) : [],
    testCases,
    verdict: verdict ?? undefined,
  }
}
