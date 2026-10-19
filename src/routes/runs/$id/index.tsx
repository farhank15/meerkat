import { createFileRoute } from '@tanstack/react-router'
import { getRun } from '@/lib/store'
import { loadLiveRun } from '@/lib/live-run'
import { Container } from '@/components/site'
import { RunDetailView } from '@/components/RunDetailView'

export const Route = createFileRoute('/runs/$id/')({
  // Fixtures resolve locally; anything else is looked up in the live CI ledger.
  loader: async ({ params }) => getRun(params.id) ?? (await loadLiveRun({ data: params.id })),
  component: RunDetail,
})

function RunDetail() {
  const run = Route.useLoaderData()

  if (!run) {
    return <Container className="py-16 text-center text-neutral-400">Run not found.</Container>
  }

  return <RunDetailView run={run} />
}
