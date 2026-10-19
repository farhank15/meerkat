// The auditor is now a tab on every run (Runs → run → Audit), where the
// evidence lives. The URL redirects instead of showing fixture data.

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_marketing/auditor')({
  beforeLoad: () => {
    throw redirect({ to: '/how-it-works' })
  },
})
