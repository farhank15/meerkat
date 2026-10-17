// Public run detail, reachable from a shared scorecard without signing in.

import { createFileRoute } from '@tanstack/react-router'
import { getProjectBySlug, getRun } from '@/lib/store'
import { Container } from '@/components/site'
import { RunDetailView } from '@/components/RunDetailView'

export const Route = createFileRoute('/share/$slug/run/$id')({
  component: PublicRun,
})

function PublicRun() {
  const { slug, id } = Route.useParams()
  const project = getProjectBySlug(slug)
  const run = getRun(id)

  if (!project || !run) {
    return (
      <Container className="py-24 text-center">
        <div className="mx-auto max-w-md">
          <div className="text-sm font-medium uppercase tracking-wider text-amber-400">
            404 · Run not found
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-neutral-50">
            No public run for “{id}”
          </h1>
          <p className="mt-3 text-sm text-neutral-500">
            This run isn’t part of the shared project, or the link is wrong.
          </p>
        </div>
      </Container>
    )
  }

  return <RunDetailView run={run} publicView />
}
