// Public, unauthenticated scorecard. Slug validity and the public flag are
// enforced by the parent route's beforeLoad.

import { Link, createFileRoute } from '@tanstack/react-router'

import { Badge, Card, CardContent, CardHeader, EmptyState, Stat, StatusBadge } from '@/components/ui/primitives'
import { ArrowRightIcon } from '@/components/ui/icons'

export const Route = createFileRoute('/share/$slug/')({
  component: SharePage,
})

function shortWhen(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function SharePage() {
  const { project } = Route.useRouteContext()
  const latest = project.latest

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-2xs font-medium uppercase tracking-wider text-accent">Scorecard</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{project.name}</h1>
          <p className="mt-1 font-mono text-2xs text-ink-subtle">{project.slug}</p>
        </div>
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
              hint={latest.tsi === null ? 'Verdict withheld' : 'Latest complete run'}
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
            <Stat label="Runs" value={project.runCount} hint="Ingested waves" />
            <Stat label="Last run" value={shortWhen(latest.startedAt)} hint="UTC" />
            <Stat
              label="Status"
              value={<StatusBadge status={latest.status} />}
              hint={latest.pr ? `PR #${latest.pr}` : 'No PR linked'}
            />
          </div>

          <Card className="mt-4">
            <CardHeader
              title="Latest run"
              description="Every number traces back to the JUnit artifact and the spec contract."
              action={
                <Link
                  to="/share/$slug/run/$id"
                  params={{ slug: project.slug, id: latest.id }}
                  className="inline-flex items-center gap-1.5 text-2xs font-medium text-accent hover:text-accent-strong"
                >
                  Open run <ArrowRightIcon width={12} height={12} />
                </Link>
              }
            />
            <CardContent className="grid gap-3 text-2xs sm:grid-cols-3">
              <div className="flex justify-between gap-3">
                <span className="text-ink-subtle">Commit</span>
                <span className="font-mono text-ink-muted">{latest.sha?.slice(0, 8) ?? '—'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-subtle">PR</span>
                <span className="text-ink-muted">{latest.pr ? `#${latest.pr}` : '—'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-subtle">TSI</span>
                <span className="mono-nums text-ink-muted">{latest.tsi ?? '—'}</span>
              </div>
            </CardContent>
          </Card>

          {project.trend.length >= 2 && (
            <Card className="mt-4">
              <CardHeader title="Index trend" description="Chronological, unsmoothed." />
              <CardContent>
                <Sparkline points={project.trend} />
              </CardContent>
            </Card>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Badge tone="neutral">Read-only</Badge>
            <span className="text-2xs text-ink-subtle">
              Want this for your repository?{' '}
              <Link to="/login" className="text-accent hover:text-accent-strong">
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
      const y = 40 - ((value - min) / span) * 32
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <svg viewBox="0 0 100 44" preserveAspectRatio="none" className="h-24 w-full" aria-hidden>
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
