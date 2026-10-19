// Workspace-scoped API key management. The plaintext is returned exactly once,
// from createKeyFn; every other read exposes the prefix only.

import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { getDb } from '@/db'
import { apiKeys, projects } from '@/db/schema'
import { resolveSession } from '@/lib/auth.server'
import { generateApiKey } from '@/lib/api-keys.server'

export interface ApiKeyRow {
  id: string
  name: string
  prefix: string
  scopes: string[]
  projectId: string | null
  projectName: string | null
  createdAt: string
  expiresAt: string | null
  lastUsedAt: string | null
  revokedAt: string | null
  state: 'active' | 'expired' | 'revoked'
}

export const listKeysFn = createServerFn({ method: 'GET' }).handler(async (): Promise<ApiKeyRow[]> => {
  const session = await resolveSession(getRequest())
  const db = getDb()
  if (!session || !db) return []

  const rows = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      scopes: apiKeys.scopes,
      projectId: apiKeys.projectId,
      projectName: projects.name,
      createdAt: apiKeys.createdAt,
      expiresAt: apiKeys.expiresAt,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .leftJoin(projects, eq(apiKeys.projectId, projects.id))
    .where(eq(apiKeys.workspaceId, session.workspace.id))
    .orderBy(desc(apiKeys.createdAt))

  const now = Date.now()
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    scopes: row.scopes,
    projectId: row.projectId,
    projectName: row.projectName,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    revokedAt: row.revokedAt?.toISOString() ?? null,
    state: row.revokedAt
      ? 'revoked'
      : row.expiresAt && row.expiresAt.getTime() <= now
        ? 'expired'
        : 'active',
  }))
})

export const createKeyFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      name: z.string().trim().min(1).max(60),
      /** 0 = never expires. */
      expiresInDays: z.union([z.literal(0), z.literal(30), z.literal(90), z.literal(365)]),
      projectId: z.string().uuid().optional(),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; plaintext: string; key: ApiKeyRow } | { ok: false; error: string }> => {
      const session = await resolveSession(getRequest())
      const db = getDb()
      if (!session || !db) return { ok: false, error: 'unauthenticated' }

      if (data.projectId) {
        const [project] = await db
          .select({ id: projects.id })
          .from(projects)
          .where(and(eq(projects.id, data.projectId), eq(projects.workspaceId, session.workspace.id)))
          .limit(1)
        if (!project) return { ok: false, error: 'project_not_found' }
      }

      const generated = generateApiKey()
      const expiresAt =
        data.expiresInDays === 0
          ? null
          : new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)

      const [created] = await db
        .insert(apiKeys)
        .values({
          workspaceId: session.workspace.id,
          projectId: data.projectId ?? null,
          createdByUserId: session.user.id,
          name: data.name,
          prefix: generated.prefix,
          keyHash: generated.hash,
          scopes: ['ingest', 'read'],
          expiresAt,
        })
        .returning()

      return {
        ok: true,
        plaintext: generated.plaintext,
        key: {
          id: created.id,
          name: created.name,
          prefix: created.prefix,
          scopes: created.scopes,
          projectId: created.projectId,
          projectName: null,
          createdAt: created.createdAt.toISOString(),
          expiresAt: created.expiresAt?.toISOString() ?? null,
          lastUsedAt: null,
          revokedAt: null,
          state: 'active',
        },
      }
    },
  )

export const revokeKeyFn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const session = await resolveSession(getRequest())
    const db = getDb()
    if (!session || !db) return { ok: false }

    await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, data.id), eq(apiKeys.workspaceId, session.workspace.id)))

    return { ok: true }
  })
