import { Link, createFileRoute, notFound } from '@tanstack/react-router'

import { PageHeader } from '@/components/ui/layout'
import { RunTabs } from '@/components/run-tabs'
import { Alert, Badge, Card, CardHeader, Stat, StatusBadge, VerdictBadge } from '@/components/ui/primitives'
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
function LoopPanel({ loop }: { loop: LoopAction }) {
  const escalated =
    loop.result === 'failed' || loop.result === 'escalated' || /escalat/i.test(loop.action)
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

/** The two verifications GitHub reports on every pull request: the full
 * TestSprite App suite, and the fixed main baseline a run must beat. */
function PrChecksPanel({ baseline }: { baseline: number }) {
  return (
    <Card>
      <CardHeader
        title="PR Checks"
        description="What GitHub reports on every pull request against this project."
      />
      <ul className="divide-y divide-line">
        <li className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="font-mono text-2xs text-ink">testsprite-dev</p>
            <p className="mt-0.5 text-2xs text-ink-subtle">TestSprite GitHub App · full suite, every pull request</p>
          </div>
          <Badge tone="ok">required</Badge>
        </li>
        <li className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="font-mono text-2xs text-ink">SuiteVitals Ratchet</p>
            <p className="mt-0.5 text-2xs text-ink-subtle">fixed main baseline · a drop below it keeps the loop from going green</p>
          </div>
          <Badge tone="info">baseline {baseline}</Badge>
        </li>
      </ul>
    </Card>
  )
}

function RunOverview() {
  const { id, run, project, meta } = Route.useLoaderData()
  const scored = run.status === 'complete'
  const commit = commitUrl(project.repoUrl, meta.sha)
  const failing = (run.testCases ?? []).filter((testCase) => testCase.status === 'failed')
  const shallowCount = (run.testCases ?? []).filter((testCase) => testCase.shallow).length

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
          <Stat
            label="Test Strength Index"
            value={scored ? run.metric.tsi : '—'}
            hint={scored ? 'Deterministic score' : 'Verdict withheld'}
            tone={!scored ? 'neutral' : run.metric.tsi >= 80 ? 'ok' : run.metric.tsi >= 50 ? 'warn' : 'danger'}
          />
          <Stat label="Coverage" value={`${(run.metric.coverage * 100).toFixed(1)}%`} hint="Weight 50%" />
          <Stat label="Stability" value={`${(run.metric.stability * 100).toFixed(1)}%`} hint="Weight 30%" />
          <Stat label="Pass rate" value={`${(run.metric.passRate * 100).toFixed(1)}%`} hint="Meaningful passes only" />
        </div>

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
            title={`${shallowCount} shallow pass${shallowCount > 1 ? 'es' : ''} (1 assertion)`}
          >
            These passed with a single assertion step. They do assert behaviour, so they count
            toward the pass rate — but the gate flags them so the reader knows the coverage is
            thin, not rich.
          </Alert>
        )}

        {run.loop && <LoopPanel loop={run.loop} />}

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
