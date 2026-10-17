// Layout for /share/$slug. Validates the slug once, then renders the child
// (scorecard at /share/$slug, run detail at /share/$slug/run/$id).

import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'
import { getProjectBySlug } from '@/lib/store'
import { ShareNotFound } from '@/components/ShareNotFound'

export const Route = createFileRoute('/share/$slug')({
  beforeLoad: ({ params }) => {
    if (!getProjectBySlug(params.slug)) throw notFound()
  },
  notFoundComponent: ShareNotFound,
  component: Outlet,
})
