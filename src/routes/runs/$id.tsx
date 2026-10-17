// Layout route for /runs/$id — every child (detail, coverage) sits behind the
// same auth gate. The Outlet is required: without it child routes match but
// never render.

import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AuthGate } from '@/components/AuthGate'

export const Route = createFileRoute('/runs/$id')({
  component: RunDetailLayout,
})

function RunDetailLayout() {
  return (
    <AuthGate>
      <Outlet />
    </AuthGate>
  )
}
