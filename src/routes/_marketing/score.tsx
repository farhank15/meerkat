// The standalone scoring playground moved into the product: scoring is what
// every run already does. The URL stays alive for inbound links.

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_marketing/score')({
  beforeLoad: () => {
    throw redirect({ to: '/how-it-works' })
  },
})
