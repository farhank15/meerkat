// Workspace-scoped project operations. Slugs are globally unique because the
// public scorecard URL is /share/<slug>, so collisions get a suffix.

import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import { getDb } from '@/db'
import { projects, runs } from '@/db/schema'
import { resolveSession } from '@/lib/auth.server'

export interface ProjectRow {
  id: string
  name: string
  slug: string
  repoUrl: string | null
  isPublic: boolean
  badgeEnabled: boolean
  createdAt: string
  runCount: number
  latestTsi: number | null
  latestAt: string | null
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export const listProjectsFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ProjectRow[]> => {
    const session = await resolveSession(getRequest())
    const db = getDb()
    if (!session || !db) return []

    const rows = await db
      .select({
        id: projects.id,
        name: projects.name,
        slug: projects.slug,
        repoUrl: projects.repoUrl,
        isPublic: projects.isPublic,
        badgeEnabled: projects.badgeEnabled,
        createdAt: projects.createdAt,
        runCount: sql<number>`count(${runs.id})::int`,
        // The score of the most recent run, not the best score ever seen —
        // `max(tsi)` would quietly hide a regression on this page.
        latestTsi: sql<number | null>`(array_agg(${runs.tsi} order by ${runs.createdAt} desc))[1]`,
        latestAt: sql<Date | null>`max(${runs.createdAt})`,
      })
      .from(projects)
      .leftJoin(runs, eq(runs.projectId, projects.id))
      .where(eq(projects.workspaceId, session.workspace.id))
      .groupBy(projects.id)
      .orderBy(desc(projects.createdAt))

    return rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      latestAt: row.latestAt ? new Date(row.latestAt).toISOString() : null,
    }))
  },
)

export const createProjectFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      name: z.string().trim().min(1).max(80),
      repoUrl: z.string().trim().url().optional().or(z.literal('')),
      isPublic: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }): Promise<{ ok: true; project: ProjectRow } | { ok: false; error: string }> => {
    const session = await resolveSession(getRequest())
    const db = getDb()
    if (!session || !db) return { ok: false, error: 'unauthenticated' }

    const base = slugify(data.name) || 'project'
    let slug = base
    let suffix = 1
    // Slugs are the public URL, so they are globally unique. Twenty numbered
    // attempts cover realistic collisions; past that, a random tail avoids a
    // unique-violation crash on a legitimate create.
    while (suffix <= 20) {
      const [taken] = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, slug)).limit(1)
      if (!taken) break
      suffix += 1
      slug = suffix > 20 ? `${base}-${Math.random().toString(36).slice(2, 8)}` : `${base}-${suffix}`
    }

    const [created] = await db
      .insert(projects)
      .values({
        workspaceId: session.workspace.id,
        name: data.name,
        slug,
        repoUrl: data.repoUrl || null,
        isPublic: data.isPublic ?? false,
      })
      .returning()

    return {
      ok: true,
      project: {
        id: created.id,
        name: created.name,
        slug: created.slug,
        repoUrl: created.repoUrl,
        isPublic: created.isPublic,
        badgeEnabled: created.badgeEnabled,
        createdAt: created.createdAt.toISOString(),
        runCount: 0,
        latestTsi: null,
        latestAt: null,
      },
    }
  })

export const updateProjectFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().uuid(),
      name: z.string().trim().min(1).max(80).optional(),
      repoUrl: z.string().trim().url().optional().or(z.literal('')),
      isPublic: z.boolean().optional(),
      badgeEnabled: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const session = await resolveSession(getRequest())
    const db = getDb()
    if (!session || !db) return { ok: false }

    await db
      .update(projects)
      .set({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.repoUrl !== undefined ? { repoUrl: data.repoUrl || null } : {}),
        ...(data.isPublic !== undefined ? { isPublic: data.isPublic } : {}),
        ...(data.badgeEnabled !== undefined ? { badgeEnabled: data.badgeEnabled } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, data.id), eq(projects.workspaceId, session.workspace.id)))

    return { ok: true }
  })
