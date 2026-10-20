import { Link, createFileRoute, notFound } from '@tanstack/react-router'

import { PageHeader } from '@/components/ui/layout'
import { RunTabs } from '@/components/run-tabs'
import { Alert, Badge, Card, CardHeader, Stat, StatusBadge, VerdictBadge } from '@/components/ui/primitives'
import { EscalationPanel } from '@/components/escalation-panel'
import { PrChecksPanel } from '@/components/pr-checks-panel'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { ExternalIcon } from '@/components/ui/icons'
import { getRunFn } from '@/server/runs'
import type { LoopAction } from '@/lib/store'

import ratchetBaseline from '@/../baseline/tsi.json'

export const Route = createFileRoute('/_authed/_app/runs/$id/')({
  loader: async ({ params }) => {
    const result = await getRunFn({ data: { id: params.id } })
    if (!result) throw notFound()
    return result
  },
  component: RunOverview,
})

function commitUrl(repoUrl: string | null, sha: string | null): string | null {
  if (!repoUrl || !sha || !/^[0-9a-f]{40}$/.test(sha)) return null
  return `${repoUrl}/commit/${sha}`
}

/** A shallow pass asserted exactly one step — flagged so the reader knows the
 * coverage is thin, not rich. It still counts toward the pass rate. */
function LoopPanel({
  loop,
  run,
}: {
  loop: LoopAction
  run: {
    status: string
    metric?: { tsi?: number | null; coverage?: number; stability?: number; passRate?: number } | null
  }
}) {
  const escalated =
    loop.result === 'failed' || loop.result === 'escalated' || /escalat/i.test(loop.action)
  const scored = run.status === 'complete'
  const pct = (v?: number) => (typeof v === 'number' ? `${(v * 100).toFixed(0)}%` : '—')
  return (
    <Card>
      <CardHeader
        title="Fix loop"
        description="How this run moved from a red verdict to a trusted one — or why it was escalated."
        action={
          escalated ? (
            <Badge tone="danger">escalated to human</Badge>
          ) : (
            <Badge tone={loop.result === 'green' ? 'ok' : 'warn'}>{loop.result}</Badge>
          )
        }
      />
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 py-3 text-2xs sm:grid-cols-4">
        {[
          ['PR', loop.pr],
          ['Classification', loop.classification],
          ['Action', loop.action],
          ['Result', loop.result],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex justify-between gap-3">
            <dt className="text-ink-subtle">{label}</dt>
            <dd className="mono-nums text-ink-muted">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="border-t border-line px-4 py-2.5 text-2xs text-ink-muted">
        <p className="font-medium text-ink">Remediation decision</p>
        <p className="mt-0.5">
          {loop.result === 'green'
            ? 'Completed — the proposed fix was applied and the rerun verified green, so the original failure is closed.'
            : loop.result === 'escalated'
              ? 'Escalated — the rerun stayed red, so the loop stopped and a human takes over. No further automated retries.'
              : 'In progress — no automated result yet.'}
        </p>
      </div>
      <div className="border-t border-line px-4 py-2.5 text-2xs text-ink-muted">
        <p className="font-medium text-ink">Score trace</p>
        <p className="mt-0.5 font-mono">
          TSI {scored ? (run.metric?.tsi ?? 'withheld') : 'withheld'} · Coverage {pct(run.metric?.coverage)} ·{' '}
          Stability {pct(run.metric?.stability)} · Pass rate {pct(run.metric?.passRate)}
        </p>
        {loop.classification === 'spec-drift' && (
          <p className="mt-1.5">
            <span className="font-medium text-ink">Spec drift:</span> update the test to match the
            spec, update the spec to match the behaviour, or both. A drifted scenario is not trusted
            until reconciled.
          </p>
        )}
      </div>
      {loop.fixCommit && (
        <div className="border-t border-line px-4 py-2.5">
          <a
            href={`https://github.com/farhank15/meerkat/commit/${loop.fixCommit}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-2xs text-accent hover:text-accent-strong"
          >
            fix commit {loop.fixCommit.slice(0, 8)} <ExternalIcon width={10} height={10} />
          </a>
        </div>
      )}
    </Card>
  )
}

function RunOverview() {
  const { id, run, project, meta } = Route.useLoaderData()
  const scored = run.status === 'complete'
  const commit = commitUrl(project.repoUrl, meta.sha)
  const failing = (run.testCases ?? []).filter((testCase) => testCase.status === 'failed')
  const shallowCount = (run.testCases ?? []).filter((testCase) => testCase.shallow).length
  const pct = (v?: number) => (typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '—')
  const passRate = pct(run.metric?.passRate)

  return (
    <>
      <PageHeader
        title={`Run ${id.slice(0, 8)}`}
        breadcrumbs={[{ label: 'Runs', to: '/runs' }, { label: id.slice(0, 8) }]}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span>{project.name}</span>
            <span aria-hidden>·</span>
            {commit ? (
              <a
                href={commit}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-2xs text-accent hover:text-accent-strong"
              >
                {meta.sha?.slice(0, 8)} <ExternalIcon width={10} height={10} />
              </a>
            ) : (
              <span className="font-mono text-2xs">{meta.sha?.slice(0, 8) ?? 'no commit'}</span>
            )}
            {meta.pr && (
              <>
                <span aria-hidden>·</span>
                <span>PR #{meta.pr}</span>
              </>
            )}
            {run.environment && (
              <>
                <span aria-hidden>·</span>
                <span className="rounded bg-surface-raised px-1.5 py-0.5 text-ink-subtle">{run.environment}</span>
              </>
            )}
          </span>
        }
        actions={<StatusBadge status={run.status} />}
      />
      <RunTabs id={id} />

      <div className="space-y-4 p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => {
              document
                .getElementById('commit-traceability')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            aria-label="Open commit traceability"
            className="block w-full rounded-lg text-left transition-colors hover:ring-2 hover:ring-accent"
          >
            <Stat
              label="Test Strength Index (TSI)"
              value={scored ? run.metric.tsi : 'n/a'}
              hint={scored ? 'Deterministic score · tap for commit traceability' : 'Verdict withheld'}
              tone={!scored ? 'neutral' : run.metric.tsi >= 80 ? 'ok' : run.metric.tsi >= 50 ? 'warn' : 'danger'}
            />
          </button>
          <Stat label="Coverage" value={`${(run.metric.coverage * 100).toFixed(1)}%`} hint="Weight 50%" />
          <Stat label="Stability" value={`${(run.metric.stability * 100).toFixed(1)}%`} hint="Weight 30%" />
          <Stat label="Pass rate" value={`${(run.metric.passRate * 100).toFixed(1)}%`} hint="Meaningful passes only" />
        </div>

        <Card id="commit-traceability">
          <CardHeader
            title="Commit traceability"
            description="The exact commit and run this evidence belongs to — full identifiers, no truncation."
          />
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 px-4 py-3 text-2xs sm:grid-cols-2">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-subtle">Commit</dt>
              <dd className="font-mono text-ink">{meta.sha ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-subtle">Run ID</dt>
              <dd className="font-mono text-ink">{id}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-subtle">Branch</dt>
              <dd className="font-mono text-ink-muted">{meta.branch ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-subtle">Environment</dt>
              <dd className="text-ink-muted">{run.environment ?? '—'}</dd>
            </div>
          </dl>
          <div className="border-t border-line px-4 py-2.5 text-2xs">
            <Link
              to="/runs/$id/coverage"
              params={{ id }}
              className="font-medium text-accent hover:text-accent-strong"
            >
              Open coverage detail →
            </Link>
          </div>
        </Card>

        {scored && (
          <Card>
            <CardHeader
              title="TSI score breakdown"
              description="How the Test Strength Index is composed for this run."
            />
            <div className="px-4 py-3 text-xs leading-relaxed text-ink-muted">
              <p className="font-mono text-ink">TSI = 0.5·coverage + 0.3·stability + 0.2·passRate</p>
              <p className="mt-2">
                Coverage {run.metric.coverage * 100 >= 0 ? (run.metric.coverage * 100).toFixed(0) : '0'}% (weight 50%) ·{' '}
                Stability {(run.metric.stability * 100).toFixed(0)}% (weight 30%) · Pass rate{' '}
                {(run.metric.passRate * 100).toFixed(0)}% (weight 20%)
              </p>
            </div>
          </Card>
        )}

        {run.verdict && (
          <Alert
            tone={run.verdict.state === 'green' ? 'ok' : run.verdict.state === 'failed' ? 'danger' : 'warn'}
            title={run.verdict.label}
          >
            <div className="flex flex-wrap items-center gap-2">
              <VerdictBadge state={run.verdict.state} label={run.verdict.state} />
              <span>{run.verdict.detail}</span>
            </div>
          </Alert>
        )}

        {run.verdict && (
          <Card>
            <CardHeader
              title="Verdict-Trust Gate"
              description="Every green verdict is cross-checked before it is trusted — a red or held run never reports green."
              action={
                <Link
                  to="/runs/$id/audit"
                  params={{ id }}
                  className="text-2xs font-medium text-accent hover:text-accent-strong"
                >
                  Open the full audit
                </Link>
              }
            />
            <div className="px-4 py-3 text-xs leading-relaxed text-ink-muted">
              {run.verdict.state === 'green' ? (
                <p>
                  <span className="font-medium text-ok">Trusted.</span> Every pass asserts a
                  contracted scenario, with no vacuous checks — the green verdict is backed by
                  evidence.
                </p>
              ) : (
                <p>
                  <span className="font-medium text-danger">Not trusted yet.</span>{' '}
                  {run.verdict.label}. The gate withholds a green verdict until the failure is
                  fixed or shown to be drift — it never forces green before remediation.
                </p>
              )}
              <p className="mt-2">
                <span className="font-medium text-ink">Trustworthy for remediation:</span>{' '}
                {run.verdict.state === 'failed'
                  ? 'yes — the failures are real and traceable, so an automated fix can target them.'
                  : run.verdict.state === 'green'
                    ? 'not needed — the verdict is already green.'
                    : 'no — the run is incomplete, so there is nothing trustworthy to remediate.'}
              </p>
            </div>
          </Card>
        )}

        {failing.length > 0 && (
          <Card>
            <CardHeader
              title={`${failing.length} failing test${failing.length === 1 ? '' : 's'}`}
              description="The gate reports failures as-is. A green badge here would be a lie."
              action={<Badge tone="danger">red</Badge>}
            />
            <Table caption="Failing test cases">
              <THead>
                <TR>
                  <TH>Test</TH>
                  <TH>Spec</TH>
                  <TH>Message</TH>
                </TR>
              </THead>
              <TBody>
                {failing.map((testCase) => (
                  <TR key={testCase.name}>
                    <TD className="font-mono text-2xs text-ink">{testCase.name}</TD>
                    <TD className="font-mono text-2xs">{testCase.specId ?? '—'}</TD>
                    <TD className="text-2xs">{testCase.message ?? '—'}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        )}

        {shallowCount > 0 && (
          <Alert
            tone="warn"
            title={`${shallowCount} shallow pass${shallowCount > 1 ? 'es' : ''} (1 assertion) — SV-ADQ-03`}
          >
            <p>
              A shallow pass asserts exactly one step. It is flagged as{' '}
              <span className="font-medium text-ink">SV-ADQ-03</span> — not penalised: the pass
              rate is unchanged ({passRate} → {passRate}), so it still counts toward the score.
              The gate flags it so the reader knows the coverage is thin, not rich.
            </p>
          </Alert>
        )}

        {run.verdict && typeof run.verdict.refused === 'number' && run.verdict.refused > 0 && (
          <Alert
            tone="warn"
            title={`Incomplete rerun — ${run.verdict.refused} of ${run.verdict.requested ?? '?'} testcases refused`}
          >
            The rerun did not complete: {run.verdict.completed ?? '?'} of{' '}
            {run.verdict.requested ?? '?'} testcases finished and {run.verdict.refused} refused to
            execute (the target deployment was replaced mid-run). The verdict reflects only the
            evidence that did run — it is never extrapolated.
          </Alert>
        )}

        {run.loop?.classification === 'spec-drift' && (
          <Alert tone="warn" title="Spec drift — update the test or the spec">
            This run is classified as <span className="font-medium text-ink">spec drift</span>: the
            behaviour and the SPEC.md contract disagree. Resolve it by updating the test to match
            the spec, updating the spec to match the behaviour, or both. A drifted scenario is not
            trusted until reconciled.
          </Alert>
        )}

        {run.loop && <LoopPanel loop={run.loop} run={run} />}

        <EscalationPanel escalations={run.escalations} />

        <PrChecksPanel baseline={ratchetBaseline.tsi} />

        <Card>
          <CardHeader
            title="Run summary"
            action={
              <Link
                to="/runs/$id/coverage"
                params={{ id }}
                className="text-2xs font-medium text-accent hover:text-accent-strong"
              >
                Coverage detail
              </Link>
            }
          />
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 py-3 text-2xs sm:grid-cols-4">
            {[
              ['Testcases', run.total],
              ['Passed', run.passed],
              ['Failed', run.failed],
              ['Skipped', run.skipped],
              ['Meaningful passes', run.meaningfulPasses],
              ['Vacuous passes', run.vacuousCount],
              ['Shallow passes', shallowCount],
              ['Orphans', (run.testCases ?? []).filter((testCase) => !testCase.specId).length],
              ['Spec gaps', (run.specEntries ?? []).filter((entry) => !entry.covered).length],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between gap-3">
                <dt className="text-ink-subtle">{label}</dt>
                <dd className="mono-nums text-ink-muted">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  )
}
