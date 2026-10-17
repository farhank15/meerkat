// Traceability building blocks shared by the run detail page and the dedicated
// /runs/$id/coverage page. Both render the same numbers so a judge can follow a
// score from artifact → spec ID without leaving the run.

import type { Run } from '@/lib/store'

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
