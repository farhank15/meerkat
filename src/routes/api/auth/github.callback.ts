// GET /api/auth/github/callback — exchanges the code, then either signs in an
// existing account or provisions a new user + workspace.

import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { users } from '@/db/schema'
import { createAccount, ensureWorkspaceForUser, sessionCookie } from '@/lib/auth.server'

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
        const ghUser = (await fetch('https://api.github.com/user', { headers: ghHeaders }).then((r) =>
          r.json(),
        )) as { id: number; login: string; name?: string | null; avatar_url?: string | null }
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

        const email = primary.toLowerCase()
        const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)

        if (existing) {
          await db
            .update(users)
            .set({
              githubId: String(ghUser.id),
              name: existing.name ?? ghUser.name ?? ghUser.login,
              avatarUrl: existing.avatarUrl ?? ghUser.avatar_url ?? null,
              lastLoginAt: new Date(),
            })
            .where(eq(users.id, existing.id))

          const workspace = await ensureWorkspaceForUser(existing)
          if (!workspace) {
            return Response.json({ error: 'database unavailable' }, { status: 503 })
          }

          return new Response(null, {
            status: 302,
            headers: {
              location: workspace.onboardedAt ? '/dashboard' : '/onboarding',
              'set-cookie': sessionCookie(existing.id, existing.email, workspace.id),
            },
          })
        }

        const created = await createAccount({
          email,
          githubId: String(ghUser.id),
          name: ghUser.name ?? ghUser.login,
          avatarUrl: ghUser.avatar_url ?? null,
        })
        if (!created) {
          return Response.json({ error: 'database unavailable' }, { status: 503 })
        }

        return new Response(null, {
          status: 302,
          headers: {
            location: '/onboarding',
            'set-cookie': sessionCookie(created.user.id, created.user.email, created.workspace.id),
          },
        })
      },
    },
  },
})
