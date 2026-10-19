import { Link, createFileRoute } from '@tanstack/react-router'

import { Badge, Button, Card, CardContent, CardHeader, Stat } from '@/components/ui/primitives'
import { Sparkline, trendDelta } from '@/components/ui/sparkline'
import {
  ActivityIcon,
  ArrowRightIcon,
  BookIcon,
  CheckIcon,
  KeyIcon,
  ShieldIcon,
  TerminalIcon,
} from '@/components/ui/icons'
import { getPublicProjectFn } from '@/server/public'

export const Route = createFileRoute('/_marketing/')({
  loader: () => getPublicProjectFn({ data: { slug: 'meerkat-demo' } }),
  component: Landing,
})

const PROBLEMS = [
  {
    title: 'Green is not evidence',
    body: 'A suite can pass every test and still assert nothing. Visibility checks and selector-exists tests are the usual suspects.',
  },
  {
    title: 'Coverage is not strength',
    body: 'A line can be executed without being verified. Coverage tells you where the code ran, not what the test proved.',
  },
  {
    title: 'Nothing traces back',
    body: 'When a score changes, you need the commit, the artifact and the failing assertion — in one place, not four tabs.',
  },
]

const STEPS = [
  ['Run', 'TestSprite executes your scenarios against a preview deployment.'],
  ['Ingest', 'The JUnit artifact is posted to Meerkat with a scoped key.'],
  ['Score', 'Coverage, stability and meaningful pass rate become one number.'],
  ['Act', 'The agent brief lists the gaps and failures before code changes.'],
]

const WEIGHTS = [
  { label: 'Coverage', weight: 50, body: 'SPEC.md scenarios a test actually exercises.' },
  { label: 'Stability', weight: 30, body: 'Agreement across reruns of the same commit.' },
  { label: 'Pass rate', weight: 20, body: 'Passes that assert something — vacuous ones are excluded.' },
]

const SURFACES = [
  {
    icon: ActivityIcon,
    title: 'Console',
    body: 'Overview, run history, coverage trace, audit findings, projects and keys. One workspace per account.',
    to: '/login' as const,
    label: 'Open the console',
  },
  {
    icon: BookIcon,
    title: 'Public scorecard',
    body: 'A read-only page per project: latest TSI, run history and failing assertions. No sign-in, no leakage.',
    to: '/share/$slug' as const,
    params: { slug: 'meerkat-demo' },
    label: 'See a live scorecard',
  },
  {
    icon: TerminalIcon,
    title: 'Agent brief',
    body: 'An MCP server exposes the verdict, the gaps and the vacuous findings before an agent touches code.',
    to: '/docs' as const,
    label: 'MCP and CLI docs',
  },
]

const GUARANTEES = [
  {
    icon: ShieldIcon,
    title: 'Workspace boundary',
    body: 'Every query filters by the signed-in workspace. A new account starts empty — there is no shared sample pool.',
  },
  {
    icon: KeyIcon,
    title: 'Keys Meerkat generates',
    body: 'mk_live_ keys are shown once and stored as a SHA-256 hash. The database never holds a usable secret.',
  },
  {
    icon: ActivityIcon,
    title: 'Scopes and expiry',
    body: 'Ingest, read, or both. Thirty days, ninety, a year — or never, when the key lives in a locked CI secret.',
  },
  {
    icon: CheckIcon,
    title: 'Revocation is immediate',
    body: 'A revoked key fails the next request. No cache, no grace period, no waiting for a rotation window.',
  },
]

const FAMILIES = [
  ['Smoke', 2],
  ['Action configuration', 2],
  ['JUnit ingest', 3],
  ['TSI formula', 4],
  ['Assertion depth', 3],
  ['Coverage traceability', 3],
  ['Ratchet', 3],
  ['PR comment', 2],
  ['Verdict trust', 2],
  ['Spec drift', 2],
  ['Audit trail', 3],
  ['Auto-remediation', 4],
]

const FORMULA = `coverage  = covered_ids / total_ids
stability = 1 - conflicted / tested
pass_rate = meaningful_passes / total_tests

TSI = round(100 x (0.50*coverage
                 + 0.30*stability
                 + 0.20*pass_rate))`

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-2xs text-ink-subtle">No previous score</span>
  if (value === 0) return <span className="text-2xs text-ink-subtle">Unchanged vs previous</span>
  const positive = value > 0
  return (
    <span className={positive ? 'text-2xs text-ok' : 'text-2xs text-danger'}>
      {positive ? '+' : ''}
      {value} vs previous run
    </span>
  )
}

function Landing() {
  const project = Route.useLoaderData()
  const tsi = project?.latest?.tsi ?? null
  const delta = project ? trendDelta(project.trend) : null

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(55%_60%_at_50%_0%,var(--color-accent-soft),transparent)] opacity-70"
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div>
            <Badge tone="accent">TestSprite Hackathon · Season 4</Badge>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
              Know whether your green suite actually catches anything.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-muted">
              Meerkat scores every TestSprite run with the Test Strength Index — coverage, stability
              and meaningful pass rate in one deterministic number, traceable to the artifact that
              produced it.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/login" search={{ mode: 'register' }}>
                <Button variant="primary">
                  Start free <ArrowRightIcon width={14} height={14} />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="secondary">How it works</Button>
              </Link>
            </div>
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-ink-subtle">
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon width={12} height={12} className="text-accent" /> One account, one workspace
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon width={12} height={12} className="text-accent" /> No sample data
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon width={12} height={12} className="text-accent" /> No credit card
              </span>
            </p>
          </div>

          <Card className="self-start shadow-pop">
            <CardHeader
              title="Live scorecard"
              description="A real ingested run, not a fixture."
              action={
                <Badge tone={tsi === null ? 'neutral' : 'ok'}>{tsi === null ? 'no data' : 'live'}</Badge>
              }
            />
            <CardContent>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-2xs uppercase tracking-wider text-ink-subtle">Test Strength Index</div>
                  <div className="mono-nums mt-1 text-6xl font-semibold leading-none tracking-tight text-ink">
                    {tsi ?? '—'}
                  </div>
                  <div className="mt-2">
                    <Delta value={delta} />
                  </div>
                </div>
                {project?.latest?.sha && (
                  <div className="text-right">
                    <div className="text-2xs uppercase tracking-wider text-ink-subtle">Commit</div>
                    <span className="font-mono text-2xs text-ink-muted">
                      {project.latest.sha.slice(0, 8)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4">
                {project && project.trend.length >= 2 ? (
                  <Sparkline points={project.trend} className="h-16 w-full" showArea />
                ) : (
                  <div className="flex h-16 items-center justify-center rounded-md border border-line bg-canvas text-2xs text-ink-subtle">
                    Two scored runs are needed to draw a trend.
                  </div>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Stat label="Runs" value={project?.runCount ?? 0} hint="Ingested waves" />
                <Stat
                  label="Status"
                  value={project?.latest?.status ?? '—'}
                  hint={project?.latest?.pr ? `PR #${project.latest.pr}` : 'No PR linked'}
                />
              </div>

              {project && (
                <Link
                  to="/share/$slug"
                  params={{ slug: project.slug }}
                  className="mt-4 inline-flex items-center gap-1.5 text-2xs font-medium text-accent hover:text-accent-strong"
                >
                  Open the public scorecard <ArrowRightIcon width={12} height={12} />
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Proof strip ──────────────────────────────────────────────────── */}
      <section className="border-b border-line bg-surface/40">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px px-5 py-0 sm:grid-cols-4">
          {[
            ['33', 'contract scenarios'],
            ['12', 'scenario families'],
            ['3', 'weighted signals'],
            ['1', 'deterministic number'],
          ].map(([value, label]) => (
            <div key={label} className="border-l border-line px-4 py-5 first:border-l-0 sm:first:border-l">
              <div className="mono-nums text-2xl font-semibold text-ink">{value}</div>
              <div className="mt-0.5 text-2xs uppercase tracking-wider text-ink-subtle">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem ──────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="text-2xs font-medium uppercase tracking-wider text-accent">The problem</div>
        <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-ink">
          Passing tests are a claim. Meerkat checks whether the claim was earned.
        </h2>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {PROBLEMS.map((problem) => (
            <Card key={problem.title}>
              <CardContent>
                <h3 className="text-sm font-medium text-ink">{problem.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{problem.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Loop ─────────────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-surface/40">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-2xs font-medium uppercase tracking-wider text-accent">The loop</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                Four steps, one contract
              </h2>
            </div>
            <Link to="/how-it-works" className="text-2xs font-medium text-accent hover:text-accent-strong">
              Read the full explanation →
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([title, body], index) => (
              <Card key={title}>
                <CardContent>
                  <div className="mono-nums text-2xs font-semibold text-accent">0{index + 1}</div>
                  <h3 className="mt-2 text-sm font-medium text-ink">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── TSI ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <div className="text-2xs font-medium uppercase tracking-wider text-accent">The metric</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              One number you can defend
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-muted">
              Three signals, fixed weights, no timestamps inside the value. The same run data
              produces the same TSI byte for byte — so a drop is a fact, not an opinion.
            </p>
            <pre className="mt-5 overflow-x-auto rounded-md border border-line bg-canvas px-4 py-3 text-xs leading-relaxed text-ink-muted">
              <code className="font-mono">{FORMULA}</code>
            </pre>
            <p className="mt-2 text-2xs text-ink-subtle">
              Rounded half away from zero. A withheld score renders as a dash, never as zero.
            </p>
          </div>

          <div className="space-y-3">
            {WEIGHTS.map((item) => (
              <Card key={item.label}>
                <CardContent>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-sm font-medium text-ink">{item.label}</h3>
                    <span className="mono-nums text-2xs text-ink-subtle">{item.weight}%</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">{item.body}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${item.weight}%` }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Surfaces ─────────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-surface/40">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <div className="text-2xs font-medium uppercase tracking-wider text-accent">Three surfaces</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            The same evidence, wherever you read it
          </h2>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {SURFACES.map((surface) => {
              const Icon = surface.icon
              return (
                <Card key={surface.title} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-accent/20 bg-accent/10 text-accent">
                      <Icon width={16} height={16} />
                    </div>
                    <h3 className="mt-3 text-sm font-medium text-ink">{surface.title}</h3>
                    <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-muted">{surface.body}</p>
                    <Link
                      to={surface.to}
                      params={'params' in surface ? surface.params : undefined}
                      className="mt-4 inline-flex items-center gap-1.5 text-2xs font-medium text-accent hover:text-accent-strong"
                    >
                      {surface.label} <ArrowRightIcon width={12} height={12} />
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Guarantees ───────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-2xs font-medium uppercase tracking-wider text-accent">Isolation</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              A workspace, not a demo account
            </h2>
          </div>
          <Link to="/docs" className="text-2xs font-medium text-accent hover:text-accent-strong">
            Read the setup guide →
          </Link>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {GUARANTEES.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.title}>
                <CardContent className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-surface-raised text-ink-subtle">
                    <Icon width={14} height={14} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-ink">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">{item.body}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ── Coverage families ────────────────────────────────────────────── */}
      <section className="border-y border-line bg-surface/40">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <div className="text-2xs font-medium uppercase tracking-wider text-accent">The contract</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            12 families, 33 scenarios, exact expected values
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Every scenario in <span className="font-mono text-ink">SPEC.md</span> names what it
            asserts and the value it expects. That is what makes coverage a testable claim instead
            of a naming convention.
          </p>

          <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {FAMILIES.map(([name, count]) => (
              <div
                key={name}
                className="flex items-center justify-between gap-3 rounded-md border border-line bg-canvas px-3 py-2"
              >
                <span className="text-xs text-ink-muted">{name}</span>
                <span className="mono-nums text-2xs text-ink-subtle">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Honesty ──────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="text-2xs font-medium uppercase tracking-wider text-accent">Honest by design</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              A dash is not a zero
            </h2>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-ink-muted">
            <p>
              Stability needs two runs of the same commit. With one run, Meerkat reports{' '}
              <span className="font-mono text-ink">1.0</span> and labels it estimated. Coverage is
              ID-based: a test that happens to share a scenario&apos;s name but asserts nothing does
              not count.
            </p>
            <p>
              When a project has no ingested run, the score reads{' '}
              <span className="font-mono text-ink">n/a</span> and the badge says the same. A missing
              run is never rendered as a good one, and a refused rerun withholds the score instead
              of reporting a drop.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-5 px-5 py-14 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-ink">
              Score your first run in about two minutes.
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              Create a workspace, generate a key, commit one workflow file.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/docs">
              <Button variant="secondary">Read the guide</Button>
            </Link>
            <Link to="/login" search={{ mode: 'register' }}>
              <Button variant="primary">
                Start free <ArrowRightIcon width={14} height={14} />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
