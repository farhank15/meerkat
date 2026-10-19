// POST /api/auth/login — verifies credentials against Neon, returns a signed
// HttpOnly session cookie. The demo account is seeded idempotently so a fresh
// database still accepts the suite/demo credentials.

import { createFileRoute } from '@tanstack/react-router'

import { ensureDemoSeed, findUserByEmail, sessionCookie, verifyPassword } from '@/lib/auth.server'

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

        await ensureDemoSeed()
        let user
        try {
          user = await findUserByEmail(email)
        } catch (err) {
          console.error('[auth] login lookup failed:', (err as Error).message)
          return Response.json({ error: 'database unavailable' }, { status: 503 })
        }
        if (!user || !verifyPassword(password, user.passwordHash)) {
          return Response.json({ ok: false }, { status: 401 })
        }

        return new Response(JSON.stringify({ ok: true, email: user.email }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'set-cookie': sessionCookie(user.id, user.email),
          },
        })
      },
    },
  },
})
