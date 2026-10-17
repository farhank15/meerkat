import { createFileRoute } from '@tanstack/react-router'
import { getRun } from '@/lib/store'
import { Container } from '@/components/site'
import { AuthGate } from '@/components/AuthGate'
import { RunDetailView } from '@/components/RunDetailView'

export const Route = createFileRoute('/runs/$id')({
  component: RunDetail,
})

function RunDetail() {
  const { id } = Route.useParams()
  const run = getRun(id)

  if (!run) {
    return (
      <Container className="py-16 text-center text-neutral-400">Run not found.</Container>
    )
  }

  return (
    <AuthGate>
      <RunDetailView run={run} />
    </AuthGate>
  )
}
