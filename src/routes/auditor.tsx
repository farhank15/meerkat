// /auditor — the Vacuous Auditor as a public, explorable flow. Audits the demo
// run deterministically (src/lib/auditor.ts) and renders every finding with its
// row-level evidence. Same engine available to the CLI and any ingested run.

import { createFileRoute, Link } from '@tanstack/react-router'
import { DEMO_RUN } from '@/lib/store'
import { auditRun } from '@/lib/auditor'
import type { TrustState } from '@/lib/auditor'
import { Section } from '@/components/site'
import { BorderBeam } from '@/components/magicui'

export const Route = createFileRoute('/auditor')({
  component: Auditor,
})

const STATE_STYLE: Record<TrustState, { badge: string; ring: string; text: string }> = {
  trusted: { badge: 'bg-emerald-500', ring: 'border-emerald-500/30', text: 'text-emerald-300' },
  caution: { badge: 'bg-amber-500', ring: 'border-amber-500/30', text: 'text-amber-300' },
  suspect: { badge: 'bg-rose-500', ring: 'border-rose-500/30', text: 'text-rose-300' },
}

const SEVERITY_STYLE: Record<string, string> = {
  high: 'border-rose-500/25 bg-rose-500/5',
  medium: 'border-amber-500/25 bg-amber-500/5',
  low: 'border-white/10 bg-white/3',
}

function Auditor() {
  const audit = auditRun(DEMO_RUN)
  const s = STATE_STYLE[audit.state]

  return (
    <>
      <Section id="auditor">
        <div className="max-w-2xl">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-400">
            Vacuous Auditor
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-50">
            Do those green checks actually assert anything?
          </h1>
          <p className="mt-4 text-neutral-400">
            A 100% pass rate is easy to fake — by flaky luck, by checks that only
            look at pixels, or by tests that regressed into no-ops. The auditor
            classifies every testcase in the run and asks one question:{' '}
            <span className="text-neutral-200">would this suite still be green if nothing was really verified?</span>
          </p>
        </div>

        {/* Trust verdict */}
        <div className={`relative mt-8 overflow-hidden rounded-2xl border ${s.ring} bg-neutral-900/60 p-6`}>
          <BorderBeam />
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${s.badge}`} />
            <h2 className={`text-lg font-semibold ${s.text}`}>
              Verdict-Trust Gate: {audit.headline}
            </h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">{audit.rationale}</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/5 pt-4 text-xs text-neutral-500">
            <span>
              testcases <span className="text-neutral-200">{audit.counts.total}</span>
            </span>
            <span>
              meaningful passes{' '}
              <span className="text-neutral-200">{audit.counts.meaningfulPasses}</span>
            </span>
            <span>
              vacuous <span className={audit.counts.vacuous > 0 ? 'text-rose-400' : 'text-neutral-200'}>{audit.counts.vacuous}</span>
            </span>
            <span>
              orphans <span className={audit.counts.orphans > 0 ? 'text-amber-400' : 'text-neutral-200'}>{audit.counts.orphans}</span>
            </span>
            <span>
              conflicted <span className={audit.counts.conflicted > 0 ? 'text-amber-400' : 'text-neutral-200'}>{audit.counts.conflicted}</span>
            </span>
            <span>
              spec gaps <span className={audit.counts.gaps > 0 ? 'text-amber-400' : 'text-neutral-200'}>{audit.counts.gaps}</span>
            </span>
          </div>
        </div>

        {/* Findings with row-level evidence */}
        <div className="mt-6 space-y-4">
          {audit.findings.length === 0 ? (
            <p className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5 text-sm text-emerald-200">
              No findings — every pass in this run is anchored to a contracted scenario.
            </p>
          ) : (
            audit.findings.map((f) => (
              <div
                key={f.kind}
                className={`rounded-2xl border ${SEVERITY_STYLE[f.severity]} p-5`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-mono text-sm font-semibold text-neutral-100">
                    {f.title}
                  </h3>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                    severity {f.severity}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{f.detail}</p>
                <ul className="mt-3 space-y-1">
                  {f.evidence.map((e) => (
                    <li key={e} className="truncate font-mono text-[11px] text-neutral-500">
                      <span aria-hidden className="text-neutral-700">
                        └{' '}
                      </span>
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/score"
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-emerald-500"
          >
            See the scoring engine
          </Link>
          <Link
            to="/loop"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/10"
          >
            How a refused verdict aborts the loop
          </Link>
        </div>
      </Section>

      <Section className="border-t border-white/5 pt-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-50">
            Why an audit, not a vibe check
          </h2>
          <p className="mt-4 text-neutral-400">
            LLM-generated suites are known to contain weak or absent assertions at
            high rates; published studies report that a large share of
            model-generated passing tests assert the wrong behaviour. Coverage says
            what ran — <span className="text-neutral-200">not what was proven</span>. The
            auditor makes that difference enumerable: every finding names its rows,
            and the pass rate in the TSI already excludes vacuous entries, so a
            shallow suite cannot score itself green.
          </p>
        </div>
      </Section>
    </>
  )
}
