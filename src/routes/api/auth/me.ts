// GET /api/auth/me — returns whether the caller holds a valid signed session.
// The client AuthGate polls this instead of reading cookies with document.cookie
// (the session is HttpOnly now, which is the whole point).

import { createFileRoute } from '@tanstack/react-router'

import { readSession } from '@/lib/auth.server'

export const Route = createFileRoute('/api/auth/me')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const session = readSession(request)
        return Response.json({
          authed: Boolean(session),
          email: session?.email ?? null,
        })
      },
    },
  },
})
