// POST /api/auth/login — verifies credentials against Neon and returns a
// signed HttpOnly session cookie carrying the workspace claim.

import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { users } from '@/db/schema'
import {
  ensureWorkspaceForUser,
  findUserByEmail,
  sessionCookie,
  verifyPassword,
} from '@/lib/auth.server'

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { email?: string; password?: string }
        try {
          body = (await request.json()) as { email?: string; password?: string }
        } catch {
          return Response.json({ error: 'invalid body' }, { status: 400 })
        }
        const email = body.email?.trim().toLowerCase()
        const password = body.password
        if (!email || !password) {
          return Response.json({ error: 'email and password are required' }, { status: 400 })
        }

        let user
        try {
          user = await findUserByEmail(email)
        } catch (error) {
          console.error('[auth] login lookup failed:', (error as Error).message)
          return Response.json({ error: 'database unavailable' }, { status: 503 })
        }
        if (!user || !verifyPassword(password, user.passwordHash)) {
          return Response.json({ ok: false }, { status: 401 })
        }

        const workspace = await ensureWorkspaceForUser(user)
        if (!workspace) {
          return Response.json({ error: 'database unavailable' }, { status: 503 })
        }

        const db = getDb()
        await db?.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id))

        return new Response(
          JSON.stringify({
            ok: true,
            email: user.email,
            workspace: { id: workspace.id, slug: workspace.slug, name: workspace.name },
            onboarded: Boolean(workspace.onboardedAt),
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
              'set-cookie': sessionCookie(user.id, user.email, workspace.id),
            },
          },
        )
      },
    },
  },
})
