// GET /api/auth/github/callback — exchanges the code, upserts the user by
// email (falling back to their primary address), seeds the demo project, and
// establishes a signed session.

import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { users } from '@/db/schema'
import { ensureDemoSeed, sessionCookie } from '@/lib/auth.server'

export const Route = createFileRoute('/api/auth/github/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state')
        const clientId = process.env.GITHUB_CLIENT_ID
        const clientSecret = process.env.GITHUB_CLIENT_SECRET

        if (!clientId || !clientSecret) {
          return Response.json({ error: 'github_oauth_not_configured' }, { status: 501 })
        }
        if (!code || !state) {
          return new Response(null, { status: 302, headers: { location: '/login' } })
        }

        // Verify the CSRF state against the cookie minted by /api/auth/github.
        const cookieHeader = request.headers.get('cookie') ?? ''
        const cookieState = cookieHeader
          .split(';')
          .map((c) => c.trim().split('='))
          .find(([k]) => k === 'mk_oauth_state')?.[1]
        if (cookieState !== state) {
          return Response.json({ error: 'state_mismatch' }, { status: 401 })
        }

        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: `${url.origin}/api/auth/github/callback`,
          }),
        })
        const token = (await tokenRes.json()) as { access_token?: string }
        if (!token.access_token) {
          return Response.json({ error: 'github_token_exchange_failed' }, { status: 401 })
        }

        const ghHeaders = {
          authorization: `Bearer ${token.access_token}`,
          accept: 'application/vnd.github+json',
        }
        const ghUser = (await fetch('https://api.github.com/user', { headers: ghHeaders }).then(
          (r) => r.json(),
        )) as { id: number; login: string }
        const ghEmails = (await fetch('https://api.github.com/user/emails', {
          headers: ghHeaders,
        }).then((r) => r.json())) as Array<{ email: string; primary: boolean; verified: boolean }>
        const primary = ghEmails.find((e) => e.primary && e.verified)?.email

        if (!primary) {
          return Response.json(
            { error: 'github_account_has_no_verified_primary_email' },
            { status: 422 },
          )
        }

        const db = getDb()
        if (!db) {
          return Response.json({ error: 'database not configured' }, { status: 503 })
        }
        await ensureDemoSeed()

        const email = primary.toLowerCase()
        await db
          .insert(users)
          .values({ email, githubId: String(ghUser.id) })
          .onConflictDoUpdate({
            target: users.email,
            set: { githubId: String(ghUser.id) },
          })
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

        return new Response(null, {
          status: 302,
          headers: {
            location: '/runs',
            'set-cookie': sessionCookie(user.id, user.email),
          },
        })
      },
    },
  },
})

// Local import (kept at the bottom to keep the handler top-aligned).
