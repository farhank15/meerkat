import { createFileRoute, Link } from '@tanstack/react-router'
import { DEMO_PROJECT, listRuns } from '@/lib/store'
import { Container } from '@/components/site'
import { AuthGate } from '@/components/AuthGate'

export const Route = createFileRoute('/runs')({
  component: Runs,
})

function Runs() {
  const runs = listRuns(DEMO_PROJECT.id)
  return (
    <AuthGate>
    <Container className="py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-50">
          Runs
        </h1>
        <p className="mt-1 text-sm text-neutral-500">{DEMO_PROJECT.name}</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-5 py-3 font-medium">Run</th>
              <th className="px-5 py-3 font-medium">PR</th>
              <th className="px-5 py-3 font-medium">TSI</th>
              <th className="px-5 py-3 font-medium">Env</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id} className="border-b border-white/5 last:border-0">
                <td className="px-5 py-3">
                  <Link
                    to="/runs/$id"
                    params={{ id: r.id }}
                    className="font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    {r.id}
                  </Link>
                </td>
                <td className="px-5 py-3 text-neutral-400">{r.pr}</td>
                <td className="px-5 py-3 font-semibold tabular-nums text-neutral-100">
                  {r.metric.tsi}
                </td>
                <td className="px-5 py-3 text-neutral-400">{r.environment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
    </AuthGate>
  )
}
