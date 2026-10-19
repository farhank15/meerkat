// Shared run-detail view. Rendered behind AuthGate at /runs/$id and publicly at
// /share/$slug/run/$id so a shared scorecard can open a run without a login wall.

import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { DEMO_BASELINE, getProject, type Run } from '@/lib/store'
import { clusterFailures } from '@/lib/auditor'
import type { JUnitStatus } from '@/lib/junit'
import { Container, ScoreCard } from '@/components/site'
import { BorderBeam } from '@/components/magicui'
import { slugifyTestName, GapList, OrphanTable, SpecTable, TraceabilitySummary } from '@/components/CoverageTrace'

/** Only link a SHA we can address: 40 hex chars on the project's real repo. */
function commitUrl(repoUrl: string | undefined, sha: string | undefined): string | null {
  if (!repoUrl || !sha || !/^[0-9a-f]{40}$/.test(sha)) return null
  return `${repoUrl}/commit/${sha}`
}

export function RunDetailView({ run, publicView = false }: { run: Run; publicView?: boolean }) {
  const { tsi, coverage, stability, passRate } = run.metric
  const repoUrl = getProject(run.projectId)?.repoUrl
  const runCommit = commitUrl(repoUrl, run.sha)
  const scored = run.status === 'complete'
  const failureClusters = clusterFailures(run.testCases)
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard may be unavailable (insecure context) — silently no-op.
    }
  }

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
        {publicView && (
          <button
            type="button"
            onClick={onCopy}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400 transition-colors hover:border-white/20 hover:text-neutral-200"
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
        )}
      </div>

      {/* Verdict banner — the one-line answer before any number. Additive
          summary; the canonical verdict card lives in the aside (#verdict).
          Text here is deliberately unique phrasing so anchored suite text
          elsewhere on this page never matches twice. */}
      <div
        className={`mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border px-5 py-4 ${
          run.verdict?.state === 'green'
            ? 'border-emerald-500/20 bg-emerald-500/5'
            : run.verdict?.state === 'failed'
              ? 'border-rose-500/20 bg-rose-500/5'
              : 'border-amber-500/20 bg-amber-500/5'
        }`}
      >
        <span
          aria-hidden
          className={`h-2 w-2 rounded-full ${
            run.verdict?.state === 'green'
              ? 'bg-emerald-400'
              : run.verdict?.state === 'failed'
                ? 'bg-rose-400'
                : 'bg-amber-400'
          }`}
        />
        <span className="text-sm font-medium text-neutral-100">
          {run.verdict?.state === 'green'
            ? 'This run cleared the trust gate.'
            : run.verdict?.state === 'failed'
              ? 'A regression was caught — holding the release.'
              : 'Scoring is paused — the evidence wave is still arriving.'}
        </span>
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-50">
            Run {run.id}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-neutral-300">
              PR {run.pr}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs text-neutral-300">
              branch {run.branch}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-neutral-300">
              {run.environment}
            </span>
            {runCommit ? (
              <a
                href={runCommit}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs text-emerald-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-200"
              >
                Commit {run.sha.slice(0, 7)} ↗
              </a>
            ) : (
              <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-xs text-neutral-500">
                Commit {run.sha.slice(0, 7)}
              </span>
            )}
          </div>

          {/* Provenance strip — the artifacts behind every number below. */}
          <h2 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Traceability
          </h2>
          <TraceabilitySummary run={run} />

          {/* TSI source breakdown — how the score is computed. */}
          <h2
            id="tsi-breakdown"
            className="mb-3 mt-10 scroll-mt-24 text-sm font-semibold uppercase tracking-wider text-neutral-500"
          >
            TSI source breakdown
          </h2>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 p-5">
            <BorderBeam />
            <p className="text-sm text-neutral-400">
              TSI = 0.50·coverage + 0.30·stability + 0.20·pass-rate, rounded half
              away from zero.
            </p>
            <dl className="mt-4 grid grid-cols-3 gap-3">
              <Breakdown
                label="Coverage"
                value={coverage}
                weight="50%"
                detail={`${run.coverageIdsCovered}/${run.coverageIdsTotal} scenarios`}
              />
              <Breakdown
                label="Stability"
                value={stability}
                weight="30%"
                detail={`${run.tested - run.conflicted}/${run.tested} stable`}
              />
              <Breakdown
                label="Pass rate"
                value={passRate}
                weight="20%"
                detail={`${run.meaningfulPasses}/${run.total} meaningful`}
              />
            </dl>
            <div className="mt-4 border-t border-white/5 pt-3 text-sm">
              <span className="text-neutral-500">Result · </span>
              <span className="font-semibold tabular-nums text-neutral-100">
                {scored ? tsi : 'n/a'}
              </span>
              {scored && (
                <div className="mt-1 font-mono text-xs text-neutral-500">
                  0.50·{coverage.toFixed(4)} + 0.30·{stability.toFixed(4)} + 0.20·
                  {passRate.toFixed(4)} = {(
                    0.5 * coverage +
                    0.3 * stability +
                    0.2 * passRate
                  ).toFixed(4)}
                </div>
              )}
            </div>
          </div>

          {/* Source rows — every testcase in the JUnit artifact, with its verdict. */}
          <div className="mb-2 mt-6 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Source rows ({run.testCases.length})
            </h3>
            <p className="text-xs text-neutral-500">
              <span className="text-emerald-400">{run.passed} passed</span>
              {run.failed > 0 && (
                <>
                  {' · '}
                  <span className="text-rose-400">{run.failed} failed</span>
                </>
              )}
              {run.skipped > 0 && (
                <>
                  {' · '}
                  <span className="text-neutral-400">{run.skipped} skipped</span>
                </>
              )}
            </p>
          </div>
          <div className="max-h-96 overflow-auto rounded-xl border border-white/5">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-neutral-900">
                <tr className="border-b border-white/5 text-left uppercase tracking-wider text-neutral-500">
                  <th className="px-4 py-2.5 font-medium">Testcase</th>
                  <th className="px-4 py-2.5 font-medium">Spec ID</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {run.testCases.map((t) => (
                  <tr
                    key={t.name}
                    id={`testcase-${slugifyTestName(t.name)}`}
                    className="scroll-mt-24 border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-2.5 text-neutral-300">
                      <span className="font-mono">{t.name}</span>
                      {t.message && (
                        <div className="mt-1 rounded-md border border-rose-500/10 bg-rose-500/5 px-2 py-1 text-[11px] text-rose-300/90">
                          {t.message}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-neutral-400">
                      {t.specId ?? <span className="text-neutral-600">orphan</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <CaseStatus status={t.status} vacuous={t.vacuous} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Failure bundles — failed rows coalesced by shared cause so N raw
              rows read as one root cause. Quick fixes render nothing. */}
          {failureClusters.length > 0 && (
            <div className="mt-3 rounded-xl border border-white/10 bg-neutral-900/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Failure bundles ({failureClusters.length})
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {failureClusters.map((c) => (
                  <span
                    key={c.label}
                    title={c.names.join(' · ')}
                    className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-200"
                  >
                    {c.label} × {c.count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* PR Checks — the two verifications GitHub reports on every pull
              request: the full TestSprite App suite, and the fixed Main
              baseline that runs have to beat before the loop can go green. */}
          <div className="mb-3 mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              PR Checks
            </h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="px-5 py-3 font-mono">
                      testsprite-dev
                      <span className="block text-xs text-neutral-500">
                        TestSprite GitHub App · full suite, every pull request
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                        required
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-mono">
                      SuiteVitals Ratchet
                      <span className="block text-xs text-neutral-500">
                        fixed main baseline · a drop below it keeps the loop from going green
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-300">
                        baseline {DEMO_BASELINE}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Coverage traceability — every SPEC.md scenario ID. */}
          <div className="mb-3 mt-10 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Coverage traceability ({run.coverageIdsCovered}/{run.coverageIdsTotal})
            </h2>
            <Link
              to="/runs/$id/coverage"
              params={{ id: run.id }}
              className="text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
            >
              Open coverage page →
            </Link>
          </div>
          <SpecTable run={run} testHref={(name) => `#testcase-${slugifyTestName(name)}`} />

          <div className="mt-6 space-y-6">
            <GapList run={run} />
            <OrphanTable run={run} />
          </div>
        </div>

        <aside className="space-y-6">
          {scored ? (
            <ScoreCard
              tsi={tsi}
              coverage={coverage}
              stability={stability}
              passRate={passRate}
              runId={run.id}
            />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-5">
              <div className="text-xs uppercase tracking-wider text-neutral-500">TSI</div>
              <div className="mt-2 text-3xl font-bold text-neutral-400">n/a</div>
              <p className="mt-2 text-xs text-neutral-500">
                Score withheld — the rerun is incomplete ({run.verdict?.completed}/
                {run.verdict?.requested} completed, {run.verdict?.refused} refused).
              </p>
            </div>
          )}

          {/* Audit trail + commit traceability. */}
          {run.loop && (
            <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                Audit trail
              </h2>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">Run ID</dt>
                  <dd className="font-mono text-xs text-neutral-200">{run.id}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">Testcases</dt>
                  <dd className="text-right text-neutral-200">
                    <span className="text-emerald-400">{run.passed} passed</span>
                    {' · '}
                    <span className={run.failed > 0 ? 'text-rose-400' : 'text-neutral-500'}>
                      {run.failed} failed
                    </span>
                    {' · '}
                    <span className="text-neutral-500">{run.skipped} skipped</span>
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">Commit SHA</dt>
                  <dd>
                    {runCommit ? (
                      <a
                        href={runCommit}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline"
                      >
                        {run.sha.slice(0, 7)}
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-neutral-500">
                        {run.sha.slice(0, 7)}
                      </span>
                    )}
                  </dd>
                </div>
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
              </dl>
              <p className="mt-3 text-xs text-neutral-500">
                This trail pins the score to the commit above. The fix commit that closed
                the loop is listed on the{' '}
                <Link to="/loop" className="text-emerald-400 hover:text-emerald-300">
                  Loop page
                </Link>
                .
              </p>
            </div>
          )}

          {/* Verdict trust: a failed run is never silently green, and an incomplete
              rerun is held at neutral instead of being reported as a drop. */}
          <div
            id="verdict"
            className="scroll-mt-24 relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 p-5"
          >
            <BorderBeam />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Verdict
            </h2>
            <p
              className={`mt-2 text-sm font-medium ${
                run.verdict?.state === 'green'
                  ? 'text-emerald-400'
                  : run.verdict?.state === 'failed'
                    ? 'text-rose-400'
                    : 'text-amber-400'
              }`}
            >
              {run.verdict?.label ?? run.status}
            </p>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Run status</dt>
                <dd className="font-medium text-neutral-200">{run.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Gate</dt>
                <dd className="text-neutral-200">
                  {run.verdict?.state === 'green'
                    ? 'eligible'
                    : run.verdict?.state === 'failed'
                      ? 'blocked'
                      : 'neutral'}
                </dd>
              </div>
              {run.verdict?.requested !== undefined && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Requested</dt>
                    <dd className="tabular-nums text-neutral-200">{run.verdict.requested}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Completed</dt>
                    <dd className="tabular-nums text-neutral-200">{run.verdict.completed}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Refused</dt>
                    <dd className="tabular-nums text-amber-400">{run.verdict.refused}</dd>
                  </div>
                  <p className="font-mono text-xs text-neutral-500">
                    {run.verdict.completed}/{run.verdict.requested} completed,{' '}
                    {run.verdict.refused} refused
                  </p>
                </>
              )}
              <p className="pt-1 text-xs text-neutral-500">
                {run.verdict?.detail}
              </p>
              <p className="text-xs text-neutral-500">
                A refused testcase is not a failure. An incomplete rerun stays neutral and
                never passes the gate.
              </p>
            </dl>
          </div>
        </aside>
      </div>
    </Container>
  )
}

function CaseStatus({ status, vacuous }: { status: JUnitStatus; vacuous?: boolean }) {
  // Exact inner words are part of the ingested-junit contract — wrap only.
  if (status === 'failed')
    return (
      <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-300">
        failed
      </span>
    )
  if (status === 'skipped')
    return (
      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-neutral-400">
        skipped
      </span>
    )
  if (vacuous)
    return (
      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">
        passed · vacuous
      </span>
    )
  return (
    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
      passed
    </span>
  )
}

function Breakdown({
  label,
  value,
  weight,
  detail,
}: {
  label: string
  value: number
  weight: string
  detail: string
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-neutral-950/40 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-neutral-500">{label}</span>
        <span className="text-[10px] text-neutral-600">{weight}</span>
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-neutral-200">
        {(value * 100).toFixed(1)}%
      </div>
      <div className="mt-0.5 font-mono text-[10px] text-neutral-500">{detail}</div>
    </div>
  )
}
