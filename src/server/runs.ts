// Workspace-scoped read model. Every function here resolves the session first
// and filters by `projects.workspace_id` — no route may query runs directly.

import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import { getDb } from '@/db'
import { projects, runs } from '@/db/schema'
import { resolveSession } from '@/lib/auth.server'
import type { Run } from '@/lib/store'

export interface RunRow {
  id: string
  sha: string | null
  pr: string | null
  branch: string | null
  source: string
  status: string
  tsi: number | null
  startedAt: string | null
  createdAt: string
  projectId: string
  projectName: string
  projectSlug: string
}

const selection = {
  id: runs.id,
  sha: runs.sha,
  pr: runs.pr,
  branch: runs.branch,
  source: runs.source,
  status: runs.status,
  tsi: runs.tsi,
  startedAt: runs.startedAt,
  createdAt: runs.createdAt,
  projectId: runs.projectId,
  projectName: projects.name,
  projectSlug: projects.slug,
}

function toRow(row: {
  id: string
  sha: string | null
  pr: string | null
  branch: string | null
  source: string
  status: string
  tsi: number | null
  startedAt: Date | null
  createdAt: Date
  projectId: string
  projectName: string
  projectSlug: string
}): RunRow {
  return {
    ...row,
    startedAt: row.startedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

async function scopedSession() {
  const session = await resolveSession(getRequest())
  return session ?? null
}

export const listRunsFn = createServerFn({ method: 'GET' })
  .validator(z.object({ projectId: z.string().uuid().optional(), limit: z.number().int().min(1).max(100).optional() }).optional())
  .handler(async ({ data }): Promise<RunRow[]> => {
    const session = await scopedSession()
    const db = getDb()
    if (!session || !db) return []

    const filters = [eq(projects.workspaceId, session.workspace.id)]
    if (data?.projectId) filters.push(eq(runs.projectId, data.projectId))

    const rows = await db
      .select(selection)
      .from(runs)
      .innerJoin(projects, eq(runs.projectId, projects.id))
      .where(and(...filters))
      .orderBy(desc(runs.createdAt))
      .limit(data?.limit ?? 50)

    return rows.map(toRow)
  })

export const getRunFn = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string() }))
  .handler(
    async ({
      data,
    }): Promise<{
      id: string
      run: Run
      project: { id: string; name: string; slug: string; repoUrl: string | null }
      meta: { sha: string | null; pr: string | null; branch: string | null; startedAt: string | null }
    } | null> => {
      const session = await scopedSession()
      const db = getDb()
      if (!session || !db) return null

      const [row] = await db
        .select({
          id: runs.id,
          data: runs.data,
          sha: runs.sha,
          pr: runs.pr,
          branch: runs.branch,
          startedAt: runs.startedAt,
          projectId: projects.id,
          projectName: projects.name,
          projectSlug: projects.slug,
          repoUrl: projects.repoUrl,
        })
        .from(runs)
        .innerJoin(projects, eq(runs.projectId, projects.id))
        .where(and(eq(runs.id, data.id), eq(projects.workspaceId, session.workspace.id)))
        .limit(1)

      if (!row) return null

      const payload = (row.data ?? {}) as Run
      return {
        id: row.id,
        run: { ...payload, id: row.id, projectId: row.projectId },
        project: {
          id: row.projectId,
          name: row.projectName,
          slug: row.projectSlug,
          repoUrl: row.repoUrl,
        },
        meta: {
          sha: row.sha,
          pr: row.pr,
          branch: row.branch,
          startedAt: row.startedAt?.toISOString() ?? null,
        },
      }
    },
  )

export interface Overview {
  projectCount: number
  runCount: number
  latest: RunRow | null
  previous: RunRow | null
  trend: Array<{ at: string; tsi: number | null }>
  coverage: { covered: number; total: number } | null
  gaps: number
  failing: number
  verdict: string | null
}

export const getOverviewFn = createServerFn({ method: 'GET' }).handler(async (): Promise<Overview> => {
  const empty: Overview = {
    projectCount: 0,
    runCount: 0,
    latest: null,
    previous: null,
    trend: [],
    coverage: null,
    gaps: 0,
    failing: 0,
    verdict: null,
  }

  const session = await scopedSession()
  const db = getDb()
  if (!session || !db) return empty

  const [{ count: projectCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projects)
    .where(eq(projects.workspaceId, session.workspace.id))

  const [{ count: runCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(runs)
    .innerJoin(projects, eq(runs.projectId, projects.id))
    .where(eq(projects.workspaceId, session.workspace.id))

  const rows = await db
    .select({ ...selection, data: runs.data })
    .from(runs)
    .innerJoin(projects, eq(runs.projectId, projects.id))
    .where(eq(projects.workspaceId, session.workspace.id))
    .orderBy(desc(runs.createdAt))
    .limit(20)

  if (rows.length === 0) {
    return { ...empty, projectCount, runCount }
  }

  const latest = rows[0]
  const latestData = (latest.data ?? {}) as Run
  const scored = rows.filter((row) => typeof row.tsi === 'number')

  return {
    projectCount,
    runCount,
    latest: toRow(latest),
    previous: rows[1] ? toRow(rows[1]) : null,
    trend: scored
      .slice(0, 12)
      .reverse()
      .map((row) => ({ at: (row.startedAt ?? row.createdAt).toISOString(), tsi: row.tsi })),
    coverage:
      typeof latestData.coverageIdsTotal === 'number'
        ? { covered: latestData.coverageIdsCovered ?? 0, total: latestData.coverageIdsTotal }
        : null,
    gaps: (latestData.specEntries ?? []).filter((entry) => !entry.covered).length,
    failing: (latestData.testCases ?? []).filter((testCase) => testCase.status === 'failed').length,
    verdict: latestData.verdict?.state ?? null,
  }
})
