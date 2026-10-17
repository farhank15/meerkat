import { createFileRoute, Link } from '@tanstack/react-router'
import { DEMO_RUN } from '@/lib/store'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { tsi, coverage, stability, passRate } = DEMO_RUN.metric
  return (
    <div className="min-h-screen bg-neutral-950 p-8 text-neutral-100">
      <header className="mx-auto mb-10 max-w-xl">
        <h1 className="text-2xl font-bold">Meerkat</h1>
        <p className="text-neutral-400">
          Your suite is green. But is it <span className="text-emerald-400">meaningful</span>?
        </p>
      </header>
      <section className="mx-auto max-w-xl rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
        <div className="text-sm uppercase tracking-wide text-neutral-500">
          Test Strength Index
        </div>
        <div className="mt-2 text-7xl font-bold tabular-nums">{tsi}</div>
        <dl className="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-neutral-500">Coverage</dt>
            <dd className="tabular-nums">{coverage.toFixed(6)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Stability</dt>
            <dd className="tabular-nums">{stability.toFixed(6)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Pass rate</dt>
            <dd className="tabular-nums">{passRate.toFixed(6)}</dd>
          </div>
        </dl>
        <Link
          to="/runs/$id"
          params={{ id: DEMO_RUN.id }}
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500"
        >
          View first run
        </Link>
      </section>
    </div>
  )
}
