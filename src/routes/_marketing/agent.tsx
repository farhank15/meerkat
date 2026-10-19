// The agent guide now lives in /docs, next to the key and workflow it depends
// on. This URL stays alive for inbound links.

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_marketing/agent')({
  beforeLoad: () => {
    throw redirect({ to: '/docs' })
  },
})
