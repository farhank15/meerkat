import { Outlet, createFileRoute } from '@tanstack/react-router'

import { MarketingShell } from '@/components/marketing-shell'

export const Route = createFileRoute('/_marketing')({
  component: MarketingLayout,
})

function MarketingLayout() {
  return (
    <MarketingShell>
      <Outlet />
    </MarketingShell>
  )
}
