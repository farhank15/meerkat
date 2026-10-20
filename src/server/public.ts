// Public read model for /share/<slug>. Only projects with is_public = true are
// reachable here; everything else answers "not found", never "forbidden" —
// a 403 would confirm that a private project exists.

import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { getDb } from '@/db'
import { projects, runs } from '@/db/schema'
import type { Run } from '@/lib/store'

export interface PublicRun {
  id: string
  sha: string | null
  pr: string | null
  status: string
  tsi: number | null
  startedAt: string | null
  /** Scenario coverage, when the payload carries the counts. */
  coverage: { covered: number; total: number } | null
  /** 0..1, from the run payload. Null when the run withheld its score. */
  stability: number | null
  passRate: number | null
  verdict: string | null
  failing: number
  total: number
}

export interface PublicProject {
  id: string
  name: string
  slug: string
  repoUrl: string | null
  runCount: number
  latest: PublicRun | null
  recent: PublicRun[]
  trend: Array<{ at: string; tsi: number | null }>
}

type RunPayload = Partial<Run> & {
  metric?: { stability?: number; passRate?: number }
  verdict?: { state?: string }
  testCases?: Array<{ status?: string }>
}

/**
 * The public scorecard shows aggregate evidence, never the raw artifact. Every
 * field is optional in stored payloads written by older ingest clients, so each
 * read degrades to null instead of inventing a number.
 */
function summarize(data: unknown): Omit<PublicRun, 'id' | 'sha' | 'pr' | 'status' | 'tsi' | 'startedAt'> {
  const run = (data ?? {}) as RunPayload
  const covered = typeof run.coverageIdsCovered === 'number' ? run.coverageIdsCovered : null
  const idsTotal = typeof run.coverageIdsTotal === 'number' ? run.coverageIdsTotal : null

  return {
    coverage: covered !== null && idsTotal !== null ? { covered, total: idsTotal } : null,
    stability: typeof run.metric?.stability === 'number' ? run.metric.stability : null,
    passRate: typeof run.metric?.passRate === 'number' ? run.metric.passRate : null,
    verdict: typeof run.verdict?.state === 'string' ? run.verdict.state : null,
    failing: Array.isArray(run.testCases)
      ? run.testCases.filter((testCase) => testCase.status === 'failed').length
      : 0,
    total: typeof run.total === 'number' ? run.total : 0,
  }
}

function toPublicRun(row: {
  id: string
  sha: string | null
  pr: string | null
  status: string
  tsi: number | null
  startedAt: Date | null
  createdAt: Date
  data: unknown
}): PublicRun {
  return {
    id: row.id,
    sha: row.sha,
    pr: row.pr,
    status: row.status,
    tsi: row.tsi,
    startedAt: (row.startedAt ?? row.createdAt).toISOString(),
    ...summarize(row.data),
  }
}

export const getPublicProjectFn = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }): Promise<PublicProject | null> => {
    const db = getDb()
    if (!db) return null

    const [project] = await db
      .select({
        id: projects.id,
        name: projects.name,
        slug: projects.slug,
        repoUrl: projects.repoUrl,
      })
      .from(projects)
      .where(and(eq(projects.slug, data.slug), eq(projects.isPublic, true)))
      .limit(1)

    if (!project) return null

    const rows = await db
      .select({
        id: runs.id,
        sha: runs.sha,
        pr: runs.pr,
        status: runs.status,
        tsi: runs.tsi,
        startedAt: runs.startedAt,
        createdAt: runs.createdAt,
        data: runs.data,
      })
      .from(runs)
      .where(eq(runs.projectId, project.id))
      .orderBy(desc(runs.createdAt))
      .limit(20)

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(runs)
      .where(eq(runs.projectId, project.id))

    const recent = rows.map(toPublicRun)
    const latest = recent[0] ?? null
    const scored = recent.filter((row) => typeof row.tsi === 'number')

    return {
      ...project,
      runCount: count,
      latest,
      recent: recent.slice(0, 8),
      trend: scored
        .slice(0, 12)
        .reverse()
        .map((row) => ({ at: row.startedAt ?? '', tsi: row.tsi })),
    }
  })

export const getPublicRunFn = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1), id: z.string() }))
  .handler(
    async ({
      data,
    }): Promise<{
      id: string
      run: Run
      project: { name: string; slug: string; repoUrl: string | null }
      meta: { sha: string | null; pr: string | null; startedAt: string | null }
    } | null> => {
      const db = getDb()
      if (!db) return null

      const [row] = await db
        .select({
          id: runs.id,
          data: runs.data,
          sha: runs.sha,
          pr: runs.pr,
          startedAt: runs.startedAt,
          projectId: projects.id,
          projectName: projects.name,
          projectSlug: projects.slug,
          repoUrl: projects.repoUrl,
        })
        .from(runs)
        .innerJoin(projects, eq(runs.projectId, projects.id))
      .where(
        and(
          or(eq(runs.id, data.id), eq(sql`${runs.data}->>'id'`, data.id)),
          eq(projects.slug, data.slug),
          eq(projects.isPublic, true),
        ),
      )
        .limit(1)

      if (!row) return null

      const payload = (row.data ?? {}) as Run
      return {
        id: row.id,
        run: { ...payload, id: row.id, projectId: row.projectId },
        project: { name: row.projectName, slug: row.projectSlug, repoUrl: row.repoUrl },
        meta: {
          sha: row.sha,
          pr: row.pr,
          startedAt: row.startedAt?.toISOString() ?? null,
        },
      }
    },
  )
