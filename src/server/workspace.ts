// Workspace settings. Scoped by the session workspace — the id is never taken
// from the client.

import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { getDb } from '@/db'
import { workspaces } from '@/db/schema'
import { resolveSession } from '@/lib/auth.server'

export const updateWorkspaceFn = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string().trim().min(1).max(80) }))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const session = await resolveSession(getRequest())
    const db = getDb()
    if (!session || !db) return { ok: false }

    await db.update(workspaces).set({ name: data.name }).where(eq(workspaces.id, session.workspace.id))
    return { ok: true }
  })

export const completeOnboardingFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<{ ok: boolean }> => {
    const session = await resolveSession(getRequest())
    const db = getDb()
    if (!session || !db) return { ok: false }

    await db
      .update(workspaces)
      .set({ onboardedAt: new Date() })
      .where(eq(workspaces.id, session.workspace.id))

    return { ok: true }
  },
)
