import { createFileRoute, Link, Navigate } from '@tanstack/react-router'
import { DEMO_PROJECT, listRuns } from '@/lib/store'
import { isAuthed } from '@/lib/session'

export const Route = createFileRoute('/runs')({
  component: Runs,
})

function Runs() {
  if (!isAuthed()) return <Navigate to="/login" />
  const runs = listRuns(DEMO_PROJECT.id)
  return (
    <div className="min-h-screen bg-neutral-950 p-8 text-neutral-100">
      <h1 className="mb-6 text-xl font-bold">Runs — {DEMO_PROJECT.name}</h1>
      <table className="w-full max-w-2xl border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-800 text-left text-neutral-400">
            <th className="px-2 py-2">Run</th>
            <th className="px-2 py-2">PR</th>
            <th className="px-2 py-2">TSI</th>
            <th className="px-2 py-2">Env</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id} className="border-b border-neutral-900">
              <td className="px-2 py-2">
                <Link to="/runs/$id" params={{ id: r.id }} className="text-emerald-400">
                  {r.id}
                </Link>
              </td>
              <td className="px-2 py-2">{r.pr}</td>
              <td className="px-2 py-2 tabular-nums">{r.metric.tsi}</td>
              <td className="px-2 py-2">{r.environment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
