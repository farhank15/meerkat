// The loop explanation merged into /how-it-works. Redirect instead of keeping a
// second copy of the same story next to fixture data.

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_marketing/loop')({
  beforeLoad: () => {
    throw redirect({ to: '/how-it-works' })
  },
})
