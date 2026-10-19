// GET /api/auth/github — starts the GitHub OAuth dance. When
// GITHUB_CLIENT_ID/SECRET are not configured, it degrades gracefully with a
// 501 JSON the UI can surface instead of throwing.

import { createFileRoute } from '@tanstack/react-router'
import { randomBytes } from 'node:crypto'

export const Route = createFileRoute('/api/auth/github')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const clientId = process.env.GITHUB_CLIENT_ID
        const origin = new URL(request.url).origin
        if (!clientId) {
          return Response.json(
            {
              error: 'github_oauth_not_configured',
              hint: 'set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET (callback: {origin}/api/auth/github/callback)',
            },
            { status: 501 },
          )
        }

        const state = randomBytes(16).toString('base64url')
        const redirectUri = `${origin}/api/auth/github/callback`
        const authorize = new URL('https://github.com/login/oauth/authorize')
        authorize.searchParams.set('client_id', clientId)
        authorize.searchParams.set('redirect_uri', redirectUri)
        authorize.searchParams.set('scope', 'read:user user:email')
        authorize.searchParams.set('state', state)

        return new Response(null, {
          status: 302,
          headers: {
            location: authorize.toString(),
            // CSRF state cookie — short lived.
            'set-cookie': `mk_oauth_state=${state}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax`,
          },
        })
      },
    },
  },
})
