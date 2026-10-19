import { Outlet, createFileRoute } from '@tanstack/react-router'

import { MarketingShell } from '@/components/marketing-shell'
import { getSessionFn } from '@/server/session'

export const Route = createFileRoute('/_marketing')({
  // The public header is session-aware: a signed-in visitor gets the account
  // menu instead of "Sign in / Start free". Resolving it in beforeLoad means
  // the first paint is already correct — no flash of the wrong CTA.
  beforeLoad: async () => ({ session: await getSessionFn().catch(() => null) }),
  component: MarketingLayout,
})

function MarketingLayout() {
  const { session } = Route.useRouteContext()

  return (
    <MarketingShell session={session}>
      <Outlet />
    </MarketingShell>
  )
}
