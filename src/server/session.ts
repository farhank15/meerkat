// Server function used by route guards. It is the only way a route learns who
// the caller is: the handler runs on the server, reads the HttpOnly cookie, and
// returns a serializable identity + workspace.

import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

import { resolveSession } from '@/lib/auth.server'

export interface AppSession {
  user: {
    id: string
    email: string
    name: string | null
    avatarUrl: string | null
    role: string
  }
  workspace: {
    id: string
    name: string
    slug: string
    onboarded: boolean
  }
}

export const getSessionFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AppSession | null> => {
    const session = await resolveSession(getRequest())
    if (!session) return null

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        avatarUrl: session.user.avatarUrl,
        role: session.user.role,
      },
      workspace: {
        id: session.workspace.id,
        name: session.workspace.name,
        slug: session.workspace.slug,
        onboarded: Boolean(session.workspace.onboardedAt),
      },
    }
  },
)
