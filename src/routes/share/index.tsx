// `/share` (no slug) has no scorecard of its own — send visitors to the demo
// public scorecard so a bare share URL still lands on a real summary.

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/share/')({
  beforeLoad: () => {
    throw redirect({ to: '/share/$slug', params: { slug: 'meerkat-demo' } })
  },
})
