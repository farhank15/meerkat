// Layout route for /runs. The list lives in runs/index.tsx and the detail view
// in runs/$id.tsx — both are children of this route, so it must render an
// Outlet. Without it the URL changes but the parent view stays on screen.

import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/runs')({
  component: Outlet,
})
