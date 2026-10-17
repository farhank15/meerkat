// Dedicated coverage page. Same numbers as the run detail section, but at its
// own URL so a gap can be linked directly from a PR comment or a review.

import { createFileRoute, Link } from '@tanstack/react-router'
import { getRun } from '@/lib/store'
import { Container, ScoreCard } from '@/components/site'
import { SpecTable, TraceabilitySummary } from '@/components/CoverageTrace'

export const Route = createFileRoute('/runs/$id/coverage')({
  component: CoveragePage,
})

function CoveragePage() {
  const { id } = Route.useParams()
  const run = getRun(id)

  if (!run) {
    return <Container className="py-16 text-center text-neutral-400">Run not found.</Container>
  }

  const { tsi, coverage, stability, passRate } = run.metric
  const gaps = run.specEntries.filter((s) => !s.covered).length

  return (
    <Container className="py-12">
      <Link
        to="/runs/$id"
        params={{ id: run.id }}
        className="text-sm text-neutral-500 transition-colors hover:text-neutral-300"
      >
        ← Run {run.id}
      </Link>

      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-50">
            Coverage traceability
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {run.coverageIdsCovered} of {run.coverageIdsTotal} specification IDs covered ·{' '}
            {gaps} gaps
          </p>

          <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Traceability
          </h2>
          <TraceabilitySummary run={run} />

          <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Specification IDs
          </h2>
          <SpecTable run={run} />
        </div>

        <aside className="space-y-6">
          <ScoreCard
            tsi={tsi}
            coverage={coverage}
            stability={stability}
            passRate={passRate}
            runId={run.id}
          />
          <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-5 text-sm text-neutral-500">
            A gap is a specification ID with no test asserting it. It lowers coverage even
            when every test that does run is green.
          </div>
        </aside>
      </div>
    </Container>
  )
}
