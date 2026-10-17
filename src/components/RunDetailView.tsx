// Shared run-detail view. Rendered behind AuthGate at /runs/$id and publicly at
// /share/$slug/run/$id so a shared scorecard can open a run without a login wall.

import { Link } from '@tanstack/react-router'
import type { Run } from '@/lib/store'
import { Container, ScoreCard } from '@/components/site'

export function RunDetailView({ run, publicView = false }: { run: Run; publicView?: boolean }) {
  const { tsi, coverage, stability, passRate } = run.metric

  return (
    <Container className="py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {publicView ? (
          <Link
            to="/share/$slug"
            params={{ slug: 'meerkat-demo' }}
            className="text-sm text-neutral-500 transition-colors hover:text-neutral-300"
          >
            ← Public scorecard
          </Link>
        ) : (
          <Link
            to="/runs"
            className="text-sm text-neutral-500 transition-colors hover:text-neutral-300"
          >
            ← Runs
          </Link>
        )}
        <Link
          to="/share/$slug"
          params={{ slug: 'meerkat-demo' }}
          className="text-sm text-emerald-400 transition-colors hover:text-emerald-300"
        >
          Public share →
        </Link>
      </div>

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

          {/* TSI source breakdown — how the score is computed. */}
          <h2
            id="tsi-breakdown"
            className="mb-3 mt-10 scroll-mt-24 text-sm font-semibold uppercase tracking-wider text-neutral-500"
          >
            TSI source breakdown
          </h2>
          <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-5">
            <p className="text-sm text-neutral-400">
              TSI = 0.50·coverage + 0.30·stability + 0.20·pass-rate, rounded half
              away from zero.
            </p>
            <dl className="mt-4 grid grid-cols-3 gap-3">
              <Breakdown label="Coverage" value={coverage} weight="50%" />
              <Breakdown label="Stability" value={stability} weight="30%" />
              <Breakdown label="Pass rate" value={passRate} weight="20%" />
            </dl>
            <div className="mt-4 border-t border-white/5 pt-3 text-sm">
              <span className="text-neutral-500">Result · </span>
              <span className="font-semibold tabular-nums text-neutral-100">{tsi}</span>
            </div>
          </div>

          {/* Coverage traceability — every SPEC.md scenario ID. */}
          <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Coverage traceability ({run.coverageIdsCovered}/{run.coverageIdsTotal})
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
            runId={run.id}
          />

          {/* Audit trail + commit traceability. */}
          {run.loop && (
            <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                Audit trail
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
                    <dt className="text-neutral-500">Commit traceability</dt>
                    <dd className="text-right">
                      <a
                        href={`https://github.com/farhank15/meerkat/commit/${run.sha}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline"
                      >
                        {run.loop.fixCommit}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Verdict trust: an incomplete rerun is held, never silently green. */}
          <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Verdict
            </h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Run status</dt>
                <dd className="font-medium text-emerald-400">{run.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Gate</dt>
                <dd className="text-neutral-200">eligible</dd>
              </div>
              <p className="pt-1 text-xs text-neutral-500">
                An incomplete rerun is held at <span className="text-neutral-300">neutral</span>{' '}
                and never passes the gate; a refused run is not a failure.
              </p>
            </dl>
          </div>
        </aside>
      </div>
    </Container>
  )
}

function Breakdown({ label, value, weight }: { label: string; value: number; weight: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-neutral-950/40 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-neutral-500">{label}</span>
        <span className="text-[10px] text-neutral-600">{weight}</span>
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-neutral-200">
        {(value * 100).toFixed(0)}%
      </div>
    </div>
  )
}
