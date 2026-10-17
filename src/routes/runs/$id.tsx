import { createFileRoute, Navigate } from '@tanstack/react-router'
import { getRun } from '@/lib/store'
import { isAuthed } from '@/lib/session'

export const Route = createFileRoute('/runs/$id')({
  component: RunDetail,
})

function RunDetail() {
  if (!isAuthed()) return <Navigate to="/login" />
  const { id } = Route.useParams()
  const run = getRun(id)
  if (!run) return <div className="p-8 text-neutral-100">Run not found.</div>

  const { tsi, coverage, stability, passRate } = run.metric

  return (
    <div className="min-h-screen bg-neutral-950 p-8 text-neutral-100">
      <h1 className="mb-6 text-xl font-bold">Run {run.id}</h1>

      <section className="mb-8 grid max-w-2xl grid-cols-4 gap-4 text-sm">
        <Metric label="TSI" value={tsi} />
        <Metric label="Coverage" value={coverage.toFixed(6)} />
        <Metric label="Stability" value={stability.toFixed(6)} />
        <Metric label="Pass rate" value={passRate.toFixed(6)} />
      </section>

      <h2 className="mb-2 text-lg font-semibold">Coverage ({run.coverageIdsCovered}/{run.coverageIdsTotal})</h2>
      <table className="w-full max-w-2xl border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-800 text-left text-neutral-400">
            <th className="px-2 py-2">ID</th>
            <th className="px-2 py-2">Status</th>
            <th className="px-2 py-2">Test</th>
          </tr>
        </thead>
        <tbody>
          {run.specEntries.map((s) => (
            <tr key={s.id} className="border-b border-neutral-900">
              <td className="px-2 py-1 font-mono text-xs">{s.id}</td>
              <td className="px-2 py-1">
                {s.covered ? (
                  <span className="text-emerald-400">covered</span>
                ) : (
                  <span className="text-amber-400">gap</span>
                )}
              </td>
              <td className="px-2 py-1 text-neutral-500">{s.testName}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {run.loop && (
        <section className="mt-8 max-w-2xl">
          <h2 className="mb-2 text-lg font-semibold">Loop</h2>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm">
            <div>PR: {run.loop.pr}</div>
            <div>Classification: {run.loop.classification}</div>
            <div>Action: {run.loop.action}</div>
            <div>Result: {run.loop.result}</div>
            {run.loop.fixCommit && <div>Fix: {run.loop.fixCommit}</div>}
          </div>
        </section>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </div>
  )
}
