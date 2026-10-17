import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { DEMO_PROJECT, listRuns } from '@/lib/store'
import { Container } from '@/components/site'
import { AuthGate } from '@/components/AuthGate'

export const Route = createFileRoute('/runs/')({
  component: Runs,
})

function Runs() {
  const runs = listRuns(DEMO_PROJECT.id)
  const navigate = useNavigate()

  return (
    <AuthGate>
      <Container className="py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-50">Runs</h1>
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
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                // The whole row is clickable — clicking anywhere (not just the
                // run id) opens the detail view.
                <tr
                  key={r.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate({ to: '/runs/$id', params: { id: r.id } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate({ to: '/runs/$id', params: { id: r.id } })
                    }
                  }}
                  className="cursor-pointer border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                >
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
                  <td className="px-5 py-3">
                    <Link
                      to="/runs/$id"
                      params={{ id: r.id }}
                      hash="tsi-breakdown"
                      className="font-semibold tabular-nums text-neutral-100 hover:text-emerald-300"
                    >
                      {r.metric.tsi}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-neutral-400">{r.environment}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to="/runs/$id"
                      params={{ id: r.id }}
                      className="whitespace-nowrap text-xs font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      View detail →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </AuthGate>
  )
}
