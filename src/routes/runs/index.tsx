import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { DEMO_PROJECT, listRuns } from '@/lib/store'
import { Container, PageHeader } from '@/components/site'
import { AuthGate } from '@/components/AuthGate'

interface IngestedRun {
  id: string
  slug: string
  source: string
  status: string
  sha: string | null
  tsi: number | string | null
  createdAt: string
  startedAt?: string | null
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Deterministic UTC stamp — same input, same output, server and client. */
function shortWhen(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`
}

/** TSI over time across live runs — chronological facts only, no smoothing. */
function TsiSparkline({ runs }: { runs: IngestedRun[] }) {
  const scored = runs
    .filter((r) => typeof r.tsi === 'number')
    .sort((a, b) =>
      (a.startedAt ?? a.createdAt).localeCompare(b.startedAt ?? b.createdAt),
    )
  if (scored.length < 2) return null

  const values = scored.map((r) => r.tsi as number)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100
      const y = 24 - ((v - min) / span) * 20 // 2px padding inside a 26px viewBox
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <svg
      aria-hidden
      viewBox="0 0 100 26"
      preserveAspectRatio="none"
      className="mt-4 h-12 w-full rounded-xl border border-white/5 bg-neutral-950/40 px-1 py-1"
    >
      <polyline
        points={points}
        fill="none"
        stroke="rgb(52 211 153)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export const Route = createFileRoute('/runs/')({
  component: Runs,
})

function Runs() {
  const runs = listRuns(DEMO_PROJECT.id)
  const navigate = useNavigate()
  const [ingested, setIngested] = useState<IngestedRun[] | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/runs')
      .then((r) => r.json())
      .then((body: { runs?: IngestedRun[] }) => {
        if (alive) setIngested(body.runs ?? [])
      })
      .catch(() => {
        if (alive) setIngested([])
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <AuthGate>
      <Container className="py-12">
        <PageHeader
          eyebrow="Evidence"
          title="Runs"
          sub="Meerkat — this repository. The committed baseline evidence stays on top; every run the CI pipeline ingests lands below, labelled live."
        />
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Baseline evidence · committed artifacts (SPEC.md + JUnit)
        </p>
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
                    {r.status === 'complete' ? (
                      <Link
                        to="/runs/$id"
                        params={{ id: r.id }}
                        hash="tsi-breakdown"
                        className="font-semibold tabular-nums text-neutral-100 hover:text-emerald-300"
                      >
                        {r.metric.tsi}
                      </Link>
                    ) : (
                      // A withheld score is not a zero — say so explicitly.
                      <Link
                        to="/runs/$id"
                        params={{ id: r.id }}
                        hash="verdict"
                        className="text-neutral-500 hover:text-neutral-300"
                      >
                        n/a
                      </Link>
                    )}
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

        {/* Live section — runs ingested by the CI workflow through the key-gated
            POST /api/runs endpoint and persisted in Neon. Distinct from the
            seeded demo evidence above, clearly labelled, never blended. */}
        <h2 className="mt-10 text-lg font-semibold tracking-tight text-neutral-100">
          Live · ingested from CI
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Runs reported by the GitHub workflow into the Neon datastore — the same
          pipeline the public TSI badge reads from.
        </p>
        <p className="mt-1.5 text-xs text-neutral-600">
          A dash for TSI means the verdict was withheld, not failed — open the row to
          see why. Rows made clickable carry the full run payload.
        </p>
        {ingested === null ? (
          <p className="mt-4 text-sm text-neutral-600">Loading live runs…</p>
        ) : ingested.length === 0 ? (
          <p className="mt-4 rounded-xl border border-white/5 bg-white/3 px-4 py-3 text-sm text-neutral-500">
            No ingested runs yet — the workflow reports here after every full suite
            execution (keyed by <code className="font-mono text-neutral-400">x-suitevitals-key</code>).
          </p>
        ) : (
          <>
            <div className="mt-5 relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/60 p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                Index trend — chronological, unsmoothed
              </div>
              <TsiSparkline runs={ingested} />
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-neutral-500">
                  <th className="px-5 py-3 font-medium">Run</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 font-medium">SHA</th>
                  <th className="px-5 py-3 font-medium">When</th>
                  <th className="px-5 py-3 font-medium">TSI</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {ingested.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]">
                    <td className="px-5 py-2.5">
                      <Link
                        to="/runs/$id"
                        params={{ id: r.id }}
                        className="font-mono text-xs text-neutral-400 transition-colors hover:text-emerald-300"
                      >
                        {r.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-5 py-2.5 text-neutral-400">{r.source}</td>
                    <td className="px-5 py-2.5 font-mono text-xs text-neutral-400">
                      {r.sha?.slice(0, 8) ?? '—'}
                    </td>
                    <td className="px-5 py-2.5 text-xs text-neutral-500">
                      {shortWhen(r.startedAt ?? r.createdAt)}
                    </td>
                    <td className="px-5 py-2.5 tabular-nums text-neutral-100">
                      {r.tsi ?? '—'}
                    </td>
                    <td className="px-5 py-2.5 text-neutral-400">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </Container>
    </AuthGate>
  )
}
