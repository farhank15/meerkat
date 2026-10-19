// /s/<slug> is the short form used in README badges and PR comments.
// It permanently redirects to the canonical /share/<slug> scorecard.

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/s/$slug')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/share/$slug', params: { slug: params.slug }, statusCode: 301 })
  },
})
