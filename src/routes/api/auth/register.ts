// POST /api/auth/register — creates a real account (email + scrypt-hashed
// password). Conflicts return 409; DB-less environments return 503.

import { createFileRoute } from '@tanstack/react-router'

import { getDb } from '@/db'
import { users } from '@/db/schema'
import { ensureDemoSeed, findUserByEmail, hashPassword, sessionCookie } from '@/lib/auth.server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const Route = createFileRoute('/api/auth/register')({
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
        if (!email || !EMAIL_RE.test(email) || !password || password.length < 8) {
          return Response.json(
            { error: 'valid email and a password of at least 8 characters are required' },
            { status: 400 },
          )
        }

        const db = getDb()
        if (!db) {
          return Response.json({ error: 'database not configured' }, { status: 503 })
        }
        await ensureDemoSeed()
        if (await findUserByEmail(email)) {
          return Response.json({ error: 'email already registered' }, { status: 409 })
        }

        const [created] = await db
          .insert(users)
          .values({ email, passwordHash: hashPassword(password) })
          .returning()

        return new Response(JSON.stringify({ ok: true, email: created.email }), {
          status: 201,
          headers: {
            'content-type': 'application/json',
            'set-cookie': sessionCookie(created.id, created.email),
          },
        })
      },
    },
  },
})
