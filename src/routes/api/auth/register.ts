// POST /api/auth/register — creates an account AND its workspace in one
// transaction. A user without a workspace is never a valid state, which is the
// bug that made every new account land in the shared demo data.

import { createFileRoute } from '@tanstack/react-router'

import { createAccount, findUserByEmail, hashPassword, sessionCookie } from '@/lib/auth.server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const Route = createFileRoute('/api/auth/register')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { email?: string; password?: string; name?: string }
        try {
          body = (await request.json()) as { email?: string; password?: string; name?: string }
        } catch {
          return Response.json({ error: 'invalid body' }, { status: 400 })
        }
        const email = body.email?.trim().toLowerCase()
        const password = body.password
        if (!email || !EMAIL_RE.test(email) || !password || password.length < 8) {
          return Response.json(
            { error: 'valid email and a password of at least 8 characters are required' },
            { status: 400 },
          )
        }

        if (await findUserByEmail(email)) {
          return Response.json({ error: 'email already registered' }, { status: 409 })
        }

        const created = await createAccount({
          email,
          passwordHash: hashPassword(password),
          name: body.name?.trim() || null,
        })
        if (!created) {
          return Response.json({ error: 'database not configured' }, { status: 503 })
        }

        return new Response(
          JSON.stringify({
            ok: true,
            email: created.user.email,
            workspace: {
              id: created.workspace.id,
              slug: created.workspace.slug,
              name: created.workspace.name,
            },
            onboarded: false,
          }),
          {
            status: 201,
            headers: {
              'content-type': 'application/json',
              'set-cookie': sessionCookie(created.user.id, created.user.email, created.workspace.id),
            },
          },
        )
      },
    },
  },
})
