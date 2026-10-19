import { Link, createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '@/components/ui/layout'
import { Badge, Button, Card, CardContent, CardHeader, EmptyState, Stat, StatusBadge } from '@/components/ui/primitives'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { ActivityIcon, ArrowRightIcon, PlusIcon } from '@/components/ui/icons'
import { getOverviewFn, listRunsFn } from '@/server/runs'

export const Route = createFileRoute('/_authed/_app/dashboard')({
  loader: async () => {
    const [overview, recent] = await Promise.all([getOverviewFn(), listRunsFn({ data: { limit: 6 } })])
    return { overview, recent }
  },
  component: Dashboard,
})

function Sparkline({ points }: { points: Array<{ at: string; tsi: number | null }> }) {
  const scored = points.filter((point): point is { at: string; tsi: number } => typeof point.tsi === 'number')
  if (scored.length < 2) return null

  const values = scored.map((point) => point.tsi)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const coords = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100
      const y = 30 - ((value - min) / span) * 24
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-16 w-full" aria-hidden>
      <polyline
        points={coords}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function Dashboard() {
  const { overview, recent } = Route.useLoaderData()

  const hasProjects = overview.projectCount > 0
  const latest = overview.latest

  return (
    <>
      <PageHeader
        title="Overview"
        description="The current strength of this workspace's test evidence."
        actions={
          <Link to="/projects">
            <Button variant="primary" size="sm">
              <PlusIcon width={14} height={14} /> New project
            </Button>
          </Link>
        }
      />

      <div className="space-y-4 p-6">
        {!hasProjects ? (
          <Card>
            <EmptyState
              icon={<ActivityIcon />}
              title="No project yet"
              description="A project maps to one repository. Create one, generate an API key, and the next TestSprite run lands here automatically."
              action={
                <Link to="/onboarding">
                  <Button variant="primary">Start setup</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                label="Test Strength Index"
                value={latest?.tsi ?? '—'}
                hint={latest ? `Latest run · ${latest.status}` : 'No run ingested yet'}
                tone={latest?.tsi == null ? 'neutral' : latest.tsi >= 80 ? 'ok' : latest.tsi >= 50 ? 'warn' : 'danger'}
              />
              <Stat
                label="Coverage"
                value={overview.coverage ? `${overview.coverage.covered}/${overview.coverage.total}` : '—'}
                hint={overview.coverage ? `${overview.gaps} scenario gap(s)` : 'Awaiting first run'}
              />
              <Stat label="Runs" value={overview.runCount} hint={`${overview.projectCount} project(s)`} />
              <Stat
                label="Failing tests"
                value={overview.failing}
                hint={overview.failing > 0 ? 'In the latest run' : 'None in the latest run'}
                tone={overview.failing > 0 ? 'danger' : 'neutral'}
              />
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader
                  title="Index trend"
                  description="Chronological, unsmoothed. Each point is one ingested wave."
                  action={<Badge tone="neutral">{overview.trend.length} scored</Badge>}
                />
                <CardContent>
                  {overview.trend.length >= 2 ? (
                    <Sparkline points={overview.trend} />
                  ) : (
                    <p className="py-6 text-center text-xs text-ink-subtle">
                      Two scored runs are needed to draw a trend.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Latest run" />
                <CardContent className="space-y-3">
                  {latest ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="mono-nums text-3xl font-semibold text-ink">{latest.tsi ?? '—'}</span>
                        <StatusBadge status={latest.status} />
                      </div>
                      <dl className="space-y-1.5 text-2xs">
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-subtle">Project</dt>
                          <dd className="truncate text-ink-muted">{latest.projectName}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-subtle">Commit</dt>
                          <dd className="font-mono text-ink-muted">{latest.sha?.slice(0, 8) ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-subtle">Source</dt>
                          <dd className="text-ink-muted">{latest.source}</dd>
                        </div>
                      </dl>
                      <Link
                        to="/runs/$id"
                        params={{ id: latest.id }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-strong"
                      >
                        Open run <ArrowRightIcon width={12} height={12} />
                      </Link>
                    </>
                  ) : (
                    <p className="py-6 text-center text-xs text-ink-subtle">No run ingested yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader
                title="Recent runs"
                action={
                  <Link to="/runs" className="text-2xs font-medium text-accent hover:text-accent-strong">
                    View all
                  </Link>
                }
              />
              {recent.length === 0 ? (
                <EmptyState title="No runs yet" description="The first ingested wave appears here." />
              ) : (
                <Table caption="Recent runs">
                  <THead>
                    <TR>
                      <TH>Run</TH>
                      <TH>Project</TH>
                      <TH>Commit</TH>
                      <TH>Source</TH>
                      <TH align="right">TSI</TH>
                      <TH>Status</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {recent.map((run) => (
                      <TR key={run.id}>
                        <TD>
                          <Link
                            to="/runs/$id"
                            params={{ id: run.id }}
                            className="font-mono text-xs text-accent hover:text-accent-strong"
                          >
                            {run.id.slice(0, 8)}
                          </Link>
                        </TD>
                        <TD className="text-ink">{run.projectName}</TD>
                        <TD className="font-mono text-2xs">{run.sha?.slice(0, 8) ?? '—'}</TD>
                        <TD className="text-2xs">{run.source}</TD>
                        <TD align="right" className="mono-nums text-ink">
                          {run.tsi ?? '—'}
                        </TD>
                        <TD>
                          <StatusBadge status={run.status} />
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </Card>
          </>
        )}
      </div>
    </>
  )
}
