// Public, unauthenticated scorecard. Slug validity and the public flag are
// enforced by the parent route's beforeLoad. Everything here is aggregate
// evidence: the score, the three signals behind it, and the run history.

import { Link, createFileRoute } from '@tanstack/react-router'

import { Badge, Card, CardContent, CardHeader, EmptyState, Stat, StatusBadge } from '@/components/ui/primitives'
import { Sparkline, trendDelta } from '@/components/ui/sparkline'
import { ScoreCalculator } from '@/components/score-calculator'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { ArrowRightIcon } from '@/components/ui/icons'

export const Route = createFileRoute('/share/$slug/')({
  component: SharePage,
})

function shortWhen(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  // UTC on both sides — the scorecard is server-rendered and the client may
  // sit in another zone.
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function percent(value: number | null): string {
  if (value === null) return '—'
  return `${Math.round(value * 100)}%`
}

function Signal({
  label,
  value,
  detail,
}: {
  label: string
  value: number | null
  detail: string
}) {
  const pct = value === null ? 0 : Math.max(0, Math.min(1, value))
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-ink-muted">{label}</span>
        <span className="mono-nums text-xs text-ink">{percent(value)}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-hover">
        {value !== null && <div className="h-full rounded-full bg-accent" style={{ width: `${pct * 100}%` }} />}
      </div>
      <p className="mt-1.5 text-2xs text-ink-subtle">{detail}</p>
    </div>
  )
}

function SharePage() {
  const { project } = Route.useRouteContext()
  const latest = project.latest
  const delta = trendDelta(project.trend)

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-2xs font-medium uppercase tracking-wider text-accent">Public scorecard</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{project.name}</h1>
          <p className="mt-1 font-mono text-2xs text-ink-subtle">{project.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-2xs font-medium text-ink-muted hover:text-ink"
            >
              Repository ↗
            </a>
          )}
          <Badge tone="neutral">Read-only</Badge>
        </div>
      </div>

      {!latest ? (
        <Card className="mt-8">
          <EmptyState
            title="No scored run yet"
            description="This project is public but has not ingested a run. A dash is not a zero — there is simply no evidence to show."
          />
        </Card>
      ) : (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Test Strength Index"
              value={latest.tsi ?? '—'}
              hint={
                delta === null
                  ? 'Latest run'
                  : `${delta > 0 ? '+' : ''}${delta} vs previous run`
              }
              tone={
                latest.tsi == null
                  ? 'neutral'
                  : latest.tsi >= 80
                    ? 'ok'
                    : latest.tsi >= 50
                      ? 'warn'
                      : 'danger'
              }
            />
            <Stat
              label="Coverage"
              value={latest.coverage ? `${latest.coverage.covered}/${latest.coverage.total}` : '—'}
              hint={latest.coverage ? 'Contract scenarios exercised' : 'Not reported by this run'}
            />
            <Stat
              label="Failing tests"
              value={latest.failing}
              hint={latest.total > 0 ? `of ${latest.total} testcases` : 'No testcase data'}
              tone={latest.failing > 0 ? 'danger' : 'neutral'}
            />
            <Stat label="Runs" value={project.runCount} hint="Ingested waves" />
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Signals behind the score"
                description="Fixed weights: coverage 50%, stability 30%, meaningful pass rate 20%."
                action={<StatusBadge status={latest.status} />}
              />
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <Signal
                  label="Coverage"
                  value={latest.coverage ? latest.coverage.covered / latest.coverage.total : null}
                  detail="SPEC.md scenarios a test exercises"
                />
                <Signal
                  label="Stability"
                  value={latest.stability}
                  detail="Agreement across reruns of one commit"
                />
                <Signal
                  label="Pass rate"
                  value={latest.passRate}
                  detail="Passes that assert something"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Latest run" />
              <CardContent className="space-y-2.5 text-2xs">
                <div className="flex justify-between gap-3">
                  <span className="text-ink-subtle">Commit</span>
                  <span className="font-mono text-ink-muted">{latest.sha?.slice(0, 8) ?? '—'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-ink-subtle">Pull request</span>
                  <span className="text-ink-muted">{latest.pr ? `#${latest.pr}` : '—'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-ink-subtle">Verdict</span>
                  <span className="text-ink-muted">{latest.verdict ?? '—'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-ink-subtle">Started</span>
                  <span className="text-ink-muted">{shortWhen(latest.startedAt)}</span>
                </div>
                <Link
                  to="/share/$slug/run/$id"
                  params={{ slug: project.slug, id: latest.id }}
                  className="inline-flex items-center gap-1.5 pt-1 text-2xs font-medium text-accent hover:text-accent-strong"
                >
                  Open the full run <ArrowRightIcon width={12} height={12} />
                </Link>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader title="Run history" description="Most recent first. Each row opens its evidence." />
            <Table caption="Recent runs">
              <THead>
                <TR>
                  <TH>Run</TH>
                  <TH>Commit</TH>
                  <TH>PR</TH>
                  <TH>Coverage</TH>
                  <TH align="right">TSI</TH>
                  <TH>Status</TH>
                  <TH>When</TH>
                </TR>
              </THead>
              <TBody>
                {project.recent.map((run) => (
                  <TR key={run.id}>
                    <TD>
                      <Link
                        to="/share/$slug/run/$id"
                        params={{ slug: project.slug, id: run.id }}
                        className="font-mono text-xs text-accent hover:text-accent-strong"
                      >
                        {run.id.slice(0, 8)}
                      </Link>
                    </TD>
                    <TD className="font-mono text-2xs">{run.sha?.slice(0, 8) ?? '—'}</TD>
                    <TD className="text-2xs">{run.pr ? `#${run.pr}` : '—'}</TD>
                    <TD className="text-2xs">
                      {run.coverage ? `${run.coverage.covered}/${run.coverage.total}` : '—'}
                    </TD>
                    <TD align="right" className="mono-nums text-ink">
                      {run.tsi == null ? <Badge tone="warn">withheld</Badge> : run.tsi}
                    </TD>
                    <TD>
                      <StatusBadge status={run.status} />
                    </TD>
                    <TD className="text-2xs">{shortWhen(run.startedAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>

          {project.trend.length >= 2 && (
            <Card className="mt-4">
              <CardHeader title="Index trend" description="Chronological, unsmoothed." />
              <CardContent>
                <Sparkline points={project.trend} className="h-24 w-full" showArea />
              </CardContent>
            </Card>
          )}

          <Card className="mt-4">
            <CardHeader
              title="CLI contract"
              description="The documented exit states of the local scorer behind every run."
            />
            <ul className="divide-y divide-line text-2xs">
              <li className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-ink-muted">A valid run scored</span>
                <span className="font-mono text-ink">exit 0 — scored</span>
              </li>
              <li className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-ink-muted">Required argument omitted</span>
                <span className="font-mono text-ink">exit 2 — missing argument</span>
              </li>
              <li className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-ink-muted">Artifact not found</span>
                <span className="font-mono text-ink">exit 3 — missing JUnit file</span>
              </li>
            </ul>
          </Card>

          <Card className="mt-4">
            <CardHeader
              title="Try the scorer"
              description="The same rounding logic the backend uses, live in your browser. Submit a boundary-case score and read the computed TSI."
            />
            <div className="p-4">
              <ScoreCalculator />
            </div>
          </Card>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-2xs text-ink-subtle">
              Want this for your repository?{' '}
              <Link to="/login" search={{ mode: 'register' }} className="text-accent hover:text-accent-strong">
                Create a workspace
              </Link>
              .
            </span>
          </div>
        </>
      )}
    </div>
  )
}
