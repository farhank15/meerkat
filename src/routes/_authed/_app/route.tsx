import { Outlet, createFileRoute } from '@tanstack/react-router'

import { AppShell } from '@/components/app-shell'
import type { AppSession } from '@/server/session'

export const Route = createFileRoute('/_authed/_app')({
  component: AppLayout,
})

function AppLayout() {
  const { session } = Route.useRouteContext() as { session: AppSession }

  return (
    <AppShell session={session}>
      <Outlet />
    </AppShell>
  )
}
