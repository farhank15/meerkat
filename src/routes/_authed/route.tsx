// Server-side guard for every authenticated route. There is no client gate:
// the session is resolved before the route renders, on the server.

import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { getSessionFn } from '@/server/session'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const session = await getSessionFn().catch(() => null)
    if (!session) throw redirect({ to: '/login' })
    return { session }
  },
  component: () => <Outlet />,
})
