// 404 for an unknown public share slug. Lives outside the route file so the
// router does not have to keep the whole route module in the client bundle.

import { Link } from '@tanstack/react-router'
import { DEMO_PROJECT } from '@/lib/store'
import { Container } from '@/components/site'

export function ShareNotFound() {
  return (
    <Container className="py-24 text-center">
      <div className="mx-auto max-w-md">
        <div className="text-sm font-medium uppercase tracking-wider text-amber-400">
          404 · Share not found
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-neutral-50">
          No public scorecard for this link
        </h1>
        <p className="mt-3 text-sm text-neutral-500">
          This share link doesn’t match a published project. Double-check the URL, or
          view the demo scorecard below.
        </p>
        <Link
          to="/share/$slug"
          params={{ slug: DEMO_PROJECT.slug }}
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-emerald-500"
        >
          View demo scorecard
        </Link>
      </div>
    </Container>
  )
}
