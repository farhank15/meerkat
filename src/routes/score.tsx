// Public scoring explainer. Surfaces the deterministic scoring engine in the UI
// (the same engine the `suitevitals score` CLI and the dashboard use) so the
// scoring story is explorable without a terminal.

import { createFileRoute, Link } from '@tanstack/react-router'
import { DEMO_RUN } from '@/lib/store'
import { tsiFromCounts } from '@/lib/tsi'
import type { RunCounts } from '@/lib/types'
import { Section } from '@/components/site'

export const Route = createFileRoute('/score')({
  component: Score,
})

function Score() {
  const { tsi, coverage, stability, passRate } = DEMO_RUN.metric

  const counts: RunCounts = {
    coveredIds: DEMO_RUN.coverageIdsCovered,
    totalIds: DEMO_RUN.coverageIdsTotal,
    conflicted: DEMO_RUN.conflicted,
    tested: DEMO_RUN.tested,
    meaningfulPasses: DEMO_RUN.meaningfulPasses,
    totalTests: DEMO_RUN.total,
  }
  // Demonstrate the engine recomputes identically from raw counts.
  const engineTsi = tsiFromCounts(counts)

  return (
    <>
      <Section id="score">
        <div className="max-w-2xl">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-400">
            Scoring engine
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-50">
            One number for how much your green suite actually proves
          </h1>
          <p className="mt-4 text-neutral-400">
            The Test Strength Index is a pure, deterministic function of three
            components. The same module powers the dashboard, the CLI, and the bot
            comment — so all three always agree byte-for-byte.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <FormulaCard label="Coverage" weight="50%" value={coverage} />
          <FormulaCard label="Stability" weight="30%" value={stability} />
          <FormulaCard label="Pass rate" weight="20%" value={passRate} />
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-neutral-900/60 p-6">
          <code className="text-sm text-neutral-300">
            TSI = 0.50·coverage + 0.30·stability + 0.20·pass-rate
          </code>
          <div className="mt-4 flex items-end justify-between border-t border-white/5 pt-4">
            <span className="text-sm text-neutral-500">Computed from the demo run</span>
            <span className="text-4xl font-bold tabular-nums text-neutral-50">
              {tsi}
              <span className="ml-2 text-sm font-normal text-neutral-500">
                (engine: {engineTsi})
              </span>
            </span>
          </div>
        </div>
      </Section>

      <Section className="border-t border-white/5 pt-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-50">
            Score from your own artifacts
          </h2>
          <p className="mt-3 text-neutral-400">
            The companion CLI scores any TestSprite JUnit result against your{' '}
            <code className="text-neutral-300">SPEC.md</code> scenario contract. Same
            input → byte-identical output.
          </p>
        </div>

        <pre className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-neutral-950 p-5 text-sm text-neutral-300">
          <code>{`# npx suitevitals score --junit testsprite-junit.xml --spec SPEC.md
{
  "tsi": ${tsi},
  "coverage": ${(coverage * 100).toFixed(1)},
  "stability": ${(stability * 100).toFixed(1)},
  "pass_rate": ${(passRate * 100).toFixed(1)},
  "gaps": [${DEMO_RUN.specEntries
    .filter((s) => !s.covered)
    .map((s) => `"${s.id}"`)
    .join(', ')}]
}`}</code>
        </pre>

        <div className="mt-6">
          <Link
            to="/share/$slug"
            params={{ slug: 'meerkat-demo' }}
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-emerald-500"
          >
            See a scored run
          </Link>
        </div>
      </Section>
    </>
  )
}

function FormulaCard({ label, weight, value }: { label: string; weight: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-300">{label}</span>
        <span className="text-[11px] text-neutral-600">{weight}</span>
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums text-neutral-100">
        {(value * 100).toFixed(0)}%
      </div>
    </div>
  )
}
