// Public read model for /share/<slug>. Only projects with is_public = true are
// reachable here; everything else answers "not found", never "forbidden" —
// a 403 would confirm that a private project exists.

import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq } from 'drizzle-orm'
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
}

export interface PublicProject {
  id: string
  name: string
  slug: string
  repoUrl: string | null
  runCount: number
  latest: PublicRun | null
  trend: Array<{ at: string; tsi: number | null }>
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
      })
      .from(runs)
      .where(eq(runs.projectId, project.id))
      .orderBy(desc(runs.createdAt))
      .limit(20)

    const latest = rows[0] ?? null
    const scored = rows.filter((row) => typeof row.tsi === 'number')

    return {
      ...project,
      runCount: rows.length,
      latest: latest
        ? {
            id: latest.id,
            sha: latest.sha,
            pr: latest.pr,
            status: latest.status,
            tsi: latest.tsi,
            startedAt: (latest.startedAt ?? latest.createdAt).toISOString(),
          }
        : null,
      trend: scored
        .slice(0, 12)
        .reverse()
        .map((row) => ({ at: (row.startedAt ?? row.createdAt).toISOString(), tsi: row.tsi })),
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
            eq(runs.id, data.id),
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
