import { createFileRoute, Navigate, Link } from '@tanstack/react-router'
import { getRun } from '@/lib/store'
import { isAuthed } from '@/lib/session'
import { Container, ScoreCard } from '@/components/site'

export const Route = createFileRoute('/runs/$id')({
  component: RunDetail,
})

function RunDetail() {
  if (!isAuthed()) return <Navigate to="/login" />
  const { id } = Route.useParams()
  const run = getRun(id)
  if (!run) {
    return (
      <Container className="py-16 text-center text-neutral-400">Run not found.</Container>
    )
  }

  const { tsi, coverage, stability, passRate } = run.metric

  return (
    <Container className="py-12">
      <Link
        to="/runs"
        className="text-sm text-neutral-500 transition-colors hover:text-neutral-300"
      >
        ← Runs
      </Link>

      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-50">
            Run {run.id}
          </h1>
          <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-500">
            <span>PR {run.pr}</span>
            <span>branch {run.branch}</span>
            <span>{run.environment}</span>
            <span className="font-mono text-xs text-neutral-600">{run.sha}</span>
          </div>

          <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Coverage ({run.coverageIdsCovered}/{run.coverageIdsTotal})
          </h2>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-neutral-500">
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Test</th>
                </tr>
              </thead>
              <tbody>
                {run.specEntries.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-2.5 font-mono text-xs text-neutral-300">
                      {s.id}
                    </td>
                    <td className="px-5 py-2.5">
                      {s.covered ? (
                        <span className="text-emerald-400">covered</span>
                      ) : (
                        <span className="text-amber-400">gap</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-neutral-500">{s.testName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6">
          <ScoreCard
            tsi={tsi}
            coverage={coverage}
            stability={stability}
            passRate={passRate}
          />
          {run.loop && (
            <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                Loop
              </h2>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">PR</dt>
                  <dd className="text-neutral-200">{run.loop.pr}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Classification</dt>
                  <dd className="text-neutral-200">{run.loop.classification}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Action</dt>
                  <dd className="text-neutral-200">{run.loop.action}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Result</dt>
                  <dd className="font-medium text-emerald-400">{run.loop.result}</dd>
                </div>
                {run.loop.fixCommit && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">Fix</dt>
                    <dd className="font-mono text-xs text-neutral-300">
                      {run.loop.fixCommit}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </aside>
      </div>
    </Container>
  )
}
