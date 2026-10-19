// POST /api/auth/logout — clears the session cookie.

import { createFileRoute } from '@tanstack/react-router'

import { clearSessionCookie } from '@/lib/auth.server'

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      POST: () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'set-cookie': clearSessionCookie(),
          },
        }),
    },
  },
})
