// Public scoring explainer. Surfaces the deterministic scoring engine in the UI
// (the same engine the `suitevitals score` CLI and the dashboard use) so the
// scoring story is explorable without a terminal.

import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { DEMO_RUN } from '@/lib/store'
import { tsiFromCounts } from '@/lib/tsi'
import { scoreFromArtifacts } from '@/lib/scoreCmd'
import { auditRun } from '@/lib/auditor'
import type { RunCounts } from '@/lib/types'
import { Section, PageHeader } from '@/components/site'
import demoJUnit from '@/lib/fixtures/testsprite-junit.xml?raw'
import specMarkdown from '../../SPEC.md?raw'

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
          <PageHeader
            eyebrow="Scoring engine"
            title="One number for how much your green suite actually proves"
            sub="The Test Strength Index is a pure, deterministic function of three components. The same module powers the dashboard, the CLI, and the bot comment — so all three always agree byte-for-byte."
          />
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
            Every number traces back to the run
          </h2>
          <p className="mt-3 text-neutral-400">
            The same deterministic engine computes this score from the run’s coverage,
            stability, and pass-rate. Open a scored run to inspect the source
            breakdown, the coverage table, the audit trail, and the commit behind it.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-neutral-900/50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-neutral-400">
              <span className="text-neutral-500">Coverage</span> {(coverage * 100).toFixed(1)}%
              <span className="mx-3 text-neutral-700">·</span>
              <span className="text-neutral-500">Stability</span> {(stability * 100).toFixed(1)}%
              <span className="mx-3 text-neutral-700">·</span>
              <span className="text-neutral-500">Pass rate</span> {(passRate * 100).toFixed(1)}%
            </div>
            <div className="text-2xl font-bold tabular-nums text-neutral-50">
              TSI {tsi}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/share/$slug"
            params={{ slug: 'meerkat-demo' }}
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-emerald-500"
          >
            See a scored run
          </Link>
          <Link
            to="/share/$slug/run/$id"
            params={{ slug: 'meerkat-demo', id: DEMO_RUN.id }}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/10"
          >
            Inspect the source breakdown
          </Link>
        </div>
      </Section>

      <Section id="playground" className="border-t border-white/5 pt-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-50">
            Score a JUnit file — right here
          </h2>
          <p className="mt-3 text-neutral-400">
            Paste a TestSprite JUnit report and run the same engine the CLI uses. Nothing
            is uploaded: the parser and the formula run in your browser, and the result is
            printed as JSON you can copy into a review.
          </p>
        </div>
        <ScorePlayground />
      </Section>

      <Section id="trust-gate" className="border-t border-white/5 pt-16">
        <div className="max-w-2xl">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-400">
            Verdict-Trust Gate
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-50">
            A green verdict is a claim — this gate audits it
          </h2>
          <p className="mt-3 text-neutral-400">
            TestSprite reports pass/fail. The Trust Gate asks the next question:
            is that green <em>earned</em>? It cross-checks the verdict against
            everything the run itself knows — vacuous passes, orphans, conflicts,
            incomplete executions — and refuses to celebrate green that asserts
            nothing.
          </p>
        </div>
        <TrustGateCard />
      </Section>

      <Section id="cli-contract" className="border-t border-white/5 pt-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-50">
            The CLI contract, on one panel
          </h2>
          <p className="mt-3 text-neutral-400">
            The scoring CLI is the offline twin of this page. Its contract is fixed and
            deterministic — here is the whole surface:
          </p>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
              Command
            </div>
            <code className="mt-3 block overflow-x-auto rounded-lg bg-neutral-950/70 p-3 font-mono text-sm text-neutral-300">
              npx suitevitals score --junit testsprite-junit.xml --spec SPEC.md
            </code>
            <p className="mt-3 text-xs text-neutral-500">
              Prints JSON: <code>{'{ tsi, coverage, stability, pass_rate, gaps }'}</code>.
              The demo fixture scores{' '}
              <strong className="text-emerald-400">TSI 93</strong>.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
              Exit codes & behaviour
            </div>
            <ul className="mt-3 space-y-2 font-mono text-sm text-neutral-300">
              <li>
                <span className="text-emerald-400">exit 0</span> — scored; same input
                twice is <strong className="text-neutral-100">byte-identical</strong>.
              </li>
              <li>
                <span className="text-rose-400">exit 2</span> — missing argument
                (<code>--junit</code> / <code>--spec</code> not supplied).
              </li>
              <li>
                <span className="text-rose-400">exit 3</span> — missing JUnit file
                (the file does not exist).
              </li>
              <li>
                <span className="text-amber-400">parse-error</span> — malformed XML is
                reported as parse-error; the run never crashes.
              </li>
            </ul>
          </div>
        </div>
      </Section>
    </>
  )
}

type PlaygroundOutput =
  | { ok: true; json: string }
  | { ok: false; error: string }

function TrustGateCard() {
  const audit = auditRun(DEMO_RUN)
  const stateStyle = {
    trusted: 'text-emerald-300',
    caution: 'text-amber-300',
    suspect: 'text-rose-300',
  }[audit.state]
  const dotStyle = {
    trusted: 'bg-emerald-500',
    caution: 'bg-amber-500',
    suspect: 'bg-rose-500',
  }[audit.state]

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-neutral-900/60 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-2.5 w-2.5 rounded-full ${dotStyle}`} />
          <p className={`font-semibold ${stateStyle}`}>{audit.headline}</p>
        </div>
        <Link
          to="/auditor"
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/10"
        >
          Open the full audit
        </Link>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-neutral-400">{audit.rationale}</p>
      <ul className="mt-4 grid gap-2 border-t border-white/5 pt-4 text-xs text-neutral-500 sm:grid-cols-2">
        <li>
          gate input · vacuous passes <span className="text-neutral-200">{audit.counts.vacuous}</span> (excluded from TSI)
        </li>
        <li>
          gate input · orphans <span className="text-neutral-200">{audit.counts.orphans}</span> · conflicts <span className="text-neutral-200">{audit.counts.conflicted}</span>
        </li>
        <li>
          gate input · spec gaps <span className="text-neutral-200">{audit.counts.gaps}</span>
        </li>
        <li>
          outcome · pass rate counts <span className="text-neutral-200">meaningful passes only</span>
        </li>
      </ul>
    </div>
  )
}

function ScorePlayground() {
  const [xml, setXml] = useState(demoJUnit)
  const [output, setOutput] = useState<PlaygroundOutput | null>(null)

  function run() {
    try {
      const result = scoreFromArtifacts(xml, specMarkdown)
      setOutput({ ok: true, json: JSON.stringify(result, null, 2) })
    } catch (err) {
      // A malformed artifact is a reported verdict, never a crash.
      setOutput({ ok: false, error: err instanceof Error ? err.message : 'parse error' })
    }
  }

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <div>
        <label
          htmlFor="junit-input"
          className="text-xs font-medium uppercase tracking-wider text-neutral-500"
        >
          JUnit XML
        </label>
        <textarea
          id="junit-input"
          value={xml}
          onChange={(e) => setXml(e.target.value)}
          spellCheck={false}
          rows={12}
          className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-950/60 p-3 font-mono text-[11px] text-neutral-300 outline-none focus:border-emerald-500/40"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={run}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-neutral-950 transition-colors hover:bg-emerald-500"
          >
            Run scoring
          </button>
          <button
            type="button"
            onClick={() => {
              setXml(demoJUnit)
              setOutput(null)
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/10"
          >
            Load demo artifact
          </button>
          <span className="font-mono text-xs text-neutral-600">SPEC.md loaded from the repo</span>
        </div>
      </div>

      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          Output
        </div>
        {output === null ? (
          <p className="mt-2 rounded-xl border border-white/10 bg-neutral-950/60 p-4 text-sm text-neutral-500">
            Press <span className="text-neutral-300">Run scoring</span> to compute the TSI
            from the artifact on the left.
          </p>
        ) : output.ok ? (
          <pre
            id="score-json"
            className="mt-2 max-h-80 overflow-auto rounded-xl border border-emerald-500/20 bg-neutral-950/60 p-4 font-mono text-[11px] text-emerald-200"
          >
            {output.json}
          </pre>
        ) : (
          <div
            id="score-error"
            className="mt-2 rounded-xl border border-rose-500/20 bg-rose-500/3 p-4 text-sm text-rose-300"
          >
            Parse error: {output.error}
            <p className="mt-1 text-xs text-neutral-500">
              The run is reported as malformed. The page keeps working.
            </p>
          </div>
        )}
      </div>
    </div>
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
