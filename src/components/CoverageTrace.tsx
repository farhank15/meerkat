// Traceability building blocks shared by the run detail page and the dedicated
// /runs/$id/coverage page. Both render the same numbers so a judge can follow a
// score from artifact → spec ID without leaving the run.

import type { Run } from '@/lib/store'
import { DEMO_PROJECT, getOrphans } from '@/lib/store'

/** Link to the exact line in SPEC.md that defines a scenario. */
function specLineHref(line: number): string {
  return `${DEMO_PROJECT.repoUrl}/blob/main/SPEC.md#L${line}`
}

/** Provenance strip: which artifacts the score was derived from. */
export function TraceabilitySummary({ run }: { run: Run }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-neutral-500">
            <th className="px-5 py-3 font-medium">Traceability source</th>
            <th className="px-5 py-3 font-medium">Artifact</th>
            <th className="px-5 py-3 font-medium">Covered</th>
            <th className="px-5 py-3 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-white/5">
            <td className="px-5 py-2.5 text-neutral-300">Specification</td>
            <td className="px-5 py-2.5 font-mono text-xs text-neutral-500">SPEC.md</td>
            <td className="px-5 py-2.5 tabular-nums text-neutral-200">
              {run.coverageIdsCovered}
            </td>
            <td className="px-5 py-2.5 tabular-nums text-neutral-500">
              {run.coverageIdsTotal}
            </td>
          </tr>
          <tr>
            <td className="px-5 py-2.5 text-neutral-300">Test results</td>
            <td className="px-5 py-2.5 font-mono text-xs text-neutral-500">junit.xml</td>
            <td className="px-5 py-2.5 tabular-nums text-neutral-200">{run.passed}</td>
            <td className="px-5 py-2.5 tabular-nums text-neutral-500">{run.total}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

/** Stable DOM id for a testcase row, so a spec row can link straight to it. */
export function slugifyTestName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Per-spec-ID coverage: covered, or an explicit gap with the orphan test name. */
export function SpecTable({
  run,
  testHref,
}: {
  run: Run
  /** When provided, the test name renders as a link to its detail view. */
  testHref?: (name: string) => string
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-neutral-500">
            <th className="px-5 py-3 font-medium">ID</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">SPEC</th>
            <th className="px-5 py-3 font-medium">Test</th>
          </tr>
        </thead>
        <tbody>
          {run.specEntries.map((s) => (
            <tr key={s.id} className="border-b border-white/5 last:border-0">
              <td className="px-5 py-2.5 font-mono text-xs text-neutral-300">{s.id}</td>
              <td className="px-5 py-2.5">
                {s.covered ? (
                  <span className="text-emerald-400">covered</span>
                ) : (
                  <span className="text-amber-400">gap</span>
                )}
              </td>
              <td className="px-5 py-2.5">
                <a
                  href={specLineHref(s.specLine)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-neutral-400 underline-offset-2 hover:text-neutral-200 hover:underline"
                >
                  SPEC.md:{s.specLine}
                </a>
              </td>
              <td className="px-5 py-2.5 text-neutral-500">
                {s.testName ? (
                  testHref ? (
                    <a
                      href={testHref(s.testName)}
                      className="text-emerald-400 underline-offset-2 transition-colors hover:text-emerald-300 hover:underline"
                    >
                      {s.testName}
                    </a>
                  ) : (
                    s.testName
                  )
                ) : (
                  <span className="text-neutral-600">no test</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Uncovered scenarios, each pointing at the exact line that defines it. */
export function GapList({ run }: { run: Run }) {
  const gaps = run.specEntries.filter((s) => !s.covered)

  return (
    <div
      id="coverage-gaps"
      className="overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/3"
    >
      <div className="border-b border-white/5 px-5 py-3">
        <h3 className="text-sm font-semibold text-amber-300">
          Uncovered specification entries ({gaps.length})
        </h3>
        <p className="mt-1 text-xs text-neutral-500">
          A gap is a scenario the contract promises and no testcase asserts. Each entry
          quotes the line&apos;s own text — the evidence that the line exists — and
          links to it in the repo.
        </p>
      </div>
      <div className="divide-y divide-white/5">
        {gaps.map((g) => (
          <details key={g.id} className="group px-5 py-3 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <span className="font-mono text-xs text-neutral-300 transition-colors group-open:text-amber-300">
                {g.id}
              </span>
              <span className="flex items-center gap-1">
                <a
                  href={specLineHref(g.specLine)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-amber-400 underline-offset-2 hover:text-amber-300 hover:underline"
                >
                  SPEC.md:{g.specLine}
                </a>
                <span aria-hidden className="text-[10px] text-neutral-600">
                  ↗
                </span>
              </span>
            </summary>
            {/* Click-to-open source view: the SPEC.md row itself, ID included —
                verification of the reference without leaving the run page. */}
            <div className="mt-2 rounded-md border border-white/5 bg-neutral-950/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">
                SPEC.md source line
              </p>
              <p className="mt-1 font-mono text-[11px] italic leading-relaxed text-neutral-300">
                &lt;{g.specLine}&gt; `{g.id} · {g.asserts}`
              </p>
              <p className="mt-1 text-[11px] text-neutral-500">
                Opens on click — the manifest line behind this gap, quoted in place.
              </p>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

/** Testcases that carry no SPEC ID — they run, but prove nothing about the contract. */
export function OrphanTable({ run }: { run: Run }) {
  const orphans = getOrphans(run)

  return (
    <div
      id="orphan-tests"
      className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50"
    >
      <div className="border-b border-white/5 px-5 py-3">
        <h3 className="text-sm font-semibold text-neutral-200">
          Orphan tests ({orphans.length})
        </h3>
        <p className="mt-1 text-xs text-neutral-500">
          These testcases carry no SPEC ID, so they cannot move the coverage score even
          when they pass. Naming a test after its scenario is what turns it into evidence.
        </p>
      </div>
      <div className="max-h-72 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-neutral-900">
            <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-5 py-2 font-medium">Testcase</th>
              <th className="px-5 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {orphans.map((t) => (
              <tr key={t.name} className="border-b border-white/5 last:border-0">
                <td className="px-5 py-2 text-neutral-400">{t.name}</td>
                <td className="px-5 py-2">
                  {t.status === 'passed' ? (
                    <span className="text-emerald-400">passed</span>
                  ) : t.status === 'failed' ? (
                    <span className="text-rose-400">failed</span>
                  ) : (
                    <span className="text-neutral-500">skipped</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
