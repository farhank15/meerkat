// Public run detail, reachable from a shared scorecard without signing in.
// Scoped to the public project named in the URL. Self-contained: it mirrors the
// authenticated run overview's trust-gate, score-trace and traceability views so
// the public flow exposes the same evidence without a separate coverage route.

import { Fragment, useState } from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'

import { Alert, Badge, Card, CardHeader, Stat, StatusBadge } from '@/components/ui/primitives'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { ArrowLeftIcon, ExternalIcon } from '@/components/ui/icons'
import { getPublicRunFn } from '@/server/public'
import type { LoopAction } from '@/lib/store'

import ratchetBaseline from '@/../baseline/tsi.json'

export const Route = createFileRoute('/share/$slug/run/$id')({
  loader: async ({ params }) => {
    const result = await getPublicRunFn({ data: { slug: params.slug, id: params.id } })
    if (!result) throw notFound()
    return result
  },
  component: PublicRun,
})

function commitUrl(repoUrl: string | null, sha: string | null): string | null {
  if (!repoUrl || !sha || !/^[0-9a-f]{40}$/.test(sha)) return null
  return `${repoUrl}/commit/${sha}`
}

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
    <Card className="mt-4">
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

function PrChecksPanel({ baseline }: { baseline: number }) {
  return (
    <Card className="mt-4">
      <CardHeader title="PR Checks" description="What GitHub reports on every pull request against this project." />
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

function PublicRun() {
  const { id, run, project, meta } = Route.useLoaderData()
  const [openGap, setOpenGap] = useState<string | null>(null)
  const [showTrace, setShowTrace] = useState(false)
  const scored = run.status === 'complete'
  const commit = commitUrl(project.repoUrl, meta.sha)
  const failing = (run.testCases ?? []).filter((testCase) => testCase.status === 'failed')
  const shallowCount = (run.testCases ?? []).filter((testCase) => testCase.shallow).length
  const metric = run.metric
  const entries = run.specEntries ?? []
  const testCases = run.testCases ?? []
  const orphans = testCases.filter((tc) => !tc.specId)

  const ratio = (value: number | undefined) =>
    typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : '—'
  const pct = (v?: number) => (typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '—')

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10">
      <Link
        to="/share/$slug"
        params={{ slug: project.slug }}
        className="inline-flex items-center gap-1.5 text-2xs text-ink-subtle hover:text-ink"
      >
        <ArrowLeftIcon width={12} height={12} /> {project.name} scorecard
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Run {id.slice(0, 8)}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-2xs text-ink-muted">
            {commit ? (
              <a
                href={commit}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-accent hover:text-accent-strong"
              >
                {meta.sha?.slice(0, 8)} <ExternalIcon width={10} height={10} />
              </a>
            ) : (
              <span className="font-mono">{meta.sha?.slice(0, 8) ?? 'no commit'}</span>
            )}
            {meta.pr && <span>· PR #{meta.pr}</span>}
            {meta.startedAt && <span>· {new Date(meta.startedAt).toISOString().slice(0, 16).replace('T', ' ')} UTC</span>}
          </div>
        </div>
        <StatusBadge status={run.status} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => setShowTrace((s) => !s)}
          aria-expanded={showTrace}
          className="surface rounded-lg px-4 py-3 text-left transition-colors hover:ring-2 hover:ring-accent"
        >
          <div className="text-2xs font-medium uppercase tracking-wider text-ink-subtle">
            Test Strength Index (TSI)
          </div>
          <div
            className={
              'mono-nums mt-1.5 text-2xl font-semibold tracking-tight ' +
              (!scored || typeof metric?.tsi !== 'number'
                ? 'text-ink'
                : metric.tsi >= 80
                  ? 'text-ok'
                  : metric.tsi >= 50
                    ? 'text-warn'
                    : 'text-danger')
            }
          >
            {scored ? (metric?.tsi ?? '—') : '—'}
          </div>
          <div className="mt-0.5 text-2xs text-ink-subtle">
            {scored ? 'Deterministic score · tap for traceability' : 'Verdict withheld'}
          </div>
        </button>
        <Stat label="Coverage" value={ratio(metric?.coverage)} hint="Weight 50%" />
        <Stat label="Stability" value={ratio(metric?.stability)} hint="Weight 30%" />
        <Stat label="Pass rate" value={ratio(metric?.passRate)} hint="Meaningful passes only" />
      </div>

      {scored && (
        <Card className="mt-4">
          <CardHeader
            title="TSI score breakdown"
            description="How the Test Strength Index is composed for this run."
          />
          <div className="px-4 py-3 text-xs leading-relaxed text-ink-muted">
            <p className="font-mono text-ink">TSI = 0.5·coverage + 0.3·stability + 0.2·passRate</p>
            <p className="mt-2">
              Coverage {pct(metric?.coverage)} (weight 50%) · Stability {pct(metric?.stability)} (weight 30%) ·{' '}
              Pass rate {pct(metric?.passRate)} (weight 20%)
            </p>
          </div>
        </Card>
      )}

      {showTrace && (
        <Card className="mt-4">
          <CardHeader
            title="TSI traceability"
            description="The JUnit source behind the score — every testcase that feeds the pass rate."
          />
          <Table caption="Test cases (JUnit source)">
            <THead>
              <TR>
                <TH>Test</TH>
                <TH>Spec</TH>
                <TH>Status</TH>
                <TH>Shallow</TH>
                <TH>Vacuous</TH>
              </TR>
            </THead>
            <TBody>
              {testCases.map((tc) => (
                <TR key={tc.name}>
                  <TD className="font-mono text-2xs text-ink">{tc.name}</TD>
                  <TD className="font-mono text-2xs">{tc.specId ?? '—'}</TD>
                  <TD>
                    <Badge tone={tc.status === 'failed' ? 'danger' : tc.status === 'passed' ? 'ok' : 'neutral'}>
                      {tc.status}
                    </Badge>
                  </TD>
                  <TD className="text-2xs">{tc.shallow ? 'yes' : '—'}</TD>
                  <TD className="text-2xs">{tc.vacuous ? 'yes' : '—'}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {run.verdict && (
        <Alert
          tone={run.verdict.state === 'green' ? 'ok' : run.verdict.state === 'failed' ? 'danger' : 'warn'}
          title={run.verdict.state === 'green' ? 'Verdict-Trust Gate: trusted' : 'Verdict-Trust Gate: not trusted yet'}
          className="mt-4"
        >
          {run.verdict.state === 'green'
            ? 'Every pass asserts a contracted scenario, with no vacuous checks — the green verdict is backed by evidence.'
            : `${run.verdict.label}. The gate withholds a green verdict until the failure is fixed or shown to be drift — it never forces green before remediation.`}
        </Alert>
      )}

      {failing.length > 0 && (
        <Card className="mt-4">
          <CardHeader
            title={`${failing.length} failing test${failing.length === 1 ? '' : 's'}`}
            action={<Badge tone="danger">red</Badge>}
          />
          <Table caption="Failing tests">
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
          className="mt-4"
        >
          These passed with a single assertion step. They do assert behaviour, so they count
          toward the pass rate — but the gate flags them so the reader knows the coverage is
          thin, not rich.
        </Alert>
      )}

      {run.loop && <LoopPanel loop={run.loop} run={run} />}

      {entries.length > 0 && (
        <Card className="mt-4">
          <CardHeader
            title="Spec coverage"
            description="Traceable to SPEC.md line by line. Gap rows expand to spec traceability."
            action={<Badge tone="neutral">{entries.length} scenario(s)</Badge>}
          />
          <Table caption="Scenario coverage">
            <THead>
              <TR>
                <TH>Scenario</TH>
                <TH>SPEC.md</TH>
                <TH>Covering test</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {entries.map((entry) => (
                <Fragment key={entry.id}>
                  <TR
                    role={!entry.covered ? 'button' : undefined}
                    aria-expanded={!entry.covered ? openGap === entry.id : undefined}
                    onClick={!entry.covered ? () => setOpenGap(openGap === entry.id ? null : entry.id) : undefined}
                    className={!entry.covered ? 'cursor-pointer hover:bg-surface-hover' : undefined}
                  >
                    <TD className="font-mono text-2xs text-ink">{entry.id}</TD>
                    <TD className="text-2xs">L{entry.specLine}</TD>
                    <TD className="font-mono text-2xs">{entry.testName ?? '—'}</TD>
                    <TD>
                      <Badge tone={entry.covered ? (entry.status === 'failed' ? 'danger' : 'ok') : 'warn'}>
                        {entry.covered ? (entry.status ?? 'covered') : 'gap'}
                      </Badge>
                    </TD>
                  </TR>
                  {!entry.covered && openGap === entry.id && (
                    <TR>
                      <TD colSpan={4} className="bg-surface px-4 py-3 align-top text-2xs text-ink-muted">
                        <p className="font-medium text-ink">Spec traceability</p>
                        <p className="mt-1">
                          SPEC.md line {entry.specLine} — {(entry as { asserts?: string }).asserts ?? entry.id}
                        </p>
                        <p className="mt-1">
                          This scenario is a gap: no testcase exercised it. It lowers coverage but
                          does not fail the suite. Open the spec to see the promised behaviour.
                        </p>
                      </TD>
                    </TR>
                  )}
                </Fragment>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {orphans.length > 0 && (
        <Card className="mt-4">
          <CardHeader
            title="Orphan tests"
            description={`${orphans.length} testcase(s) assert no SPEC scenario — visible, but not anchored to the contract.`}
          />
          <ul className="divide-y divide-line">
            {orphans.map((tc) => (
              <li key={tc.name} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="truncate font-mono text-2xs text-ink">{tc.name}</span>
                <Badge tone={tc.status === 'failed' ? 'danger' : tc.status === 'passed' ? 'ok' : 'neutral'}>
                  {tc.status}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <PrChecksPanel baseline={ratchetBaseline.tsi} />
    </div>
  )
}
