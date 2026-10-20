// GET /api/auth/me — the single read used by the client shell. Returns the
// identity AND the workspace, so no page has to guess which tenant it is in.

import { createFileRoute } from '@tanstack/react-router'

import { resolveSession } from '@/lib/auth.server'

export const Route = createFileRoute('/api/auth/me')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await resolveSession(request)
        if (!session) return Response.json({ authed: false, email: null, workspace: null })

        return Response.json({
          authed: true,
          email: session.user.email,
          name: session.user.name,
          avatarUrl: session.user.avatarUrl,
          workspace: {
            id: session.workspace.id,
            slug: session.workspace.slug,
            name: session.workspace.name,
            onboarded: Boolean(session.workspace.onboardedAt),
          },
        })
      },
    },
  },
})
