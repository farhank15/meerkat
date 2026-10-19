import { Link, createFileRoute } from '@tanstack/react-router'

import { Badge, Button, Card, CardContent, CardHeader, Stat } from '@/components/ui/primitives'
import { ArrowRightIcon, ShieldIcon, TerminalIcon, ActivityIcon } from '@/components/ui/icons'
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

function Landing() {
  const project = Route.useLoaderData()
  const tsi = project?.latest?.tsi ?? null

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <Badge tone="accent">TestSprite Hackathon · Season 4</Badge>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              Know whether your green suite actually catches anything.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-muted">
              Meerkat scores every TestSprite run with the Test Strength Index — coverage, stability
              and meaningful pass rate in one deterministic number, traceable to the artifact that
              produced it.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/login">
                <Button variant="primary">
                  Start free <ArrowRightIcon width={14} height={14} />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="secondary">How it works</Button>
              </Link>
            </div>
            <p className="mt-3 text-2xs text-ink-subtle">
              One account, one workspace. No sample data, no credit card.
            </p>
          </div>

          <Card className="self-start">
            <CardHeader
              title="Live scorecard"
              description="This is a real ingested run, not a fixture."
              action={<Badge tone={tsi === null ? 'neutral' : 'ok'}>{tsi === null ? 'no data' : 'live'}</Badge>}
            />
            <CardContent>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-2xs uppercase tracking-wider text-ink-subtle">Test Strength Index</div>
                  <div className="mono-nums mt-1 text-5xl font-semibold tracking-tight text-ink">
                    {tsi ?? '—'}
                  </div>
                </div>
                {project?.latest?.sha && (
                  <span className="font-mono text-2xs text-ink-subtle">
                    {project.latest.sha.slice(0, 8)}
                  </span>
                )}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
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

      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardHeader title="For agents" description="Read before you fix." />
            <CardContent className="space-y-2 text-xs leading-relaxed text-ink-muted">
              <TerminalIcon width={16} height={16} className="text-accent" />
              <p>
                An MCP server exposes the verdict, the gaps and the vacuous findings. Your coding
                agent reads the evidence before touching code.
              </p>
              <Link to="/docs" className="text-2xs font-medium text-accent hover:text-accent-strong">
                MCP & CLI docs →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Trust gate" description="Green must be earned." />
            <CardContent className="space-y-2 text-xs leading-relaxed text-ink-muted">
              <ShieldIcon width={16} height={16} className="text-accent" />
              <p>
                Vacuous passes, orphans, conflicting verdicts and incomplete runs withhold the
                score. A dash is not a zero.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Traceable" description="Every number has a source." />
            <CardContent className="space-y-2 text-xs leading-relaxed text-ink-muted">
              <ActivityIcon width={16} height={16} className="text-accent" />
              <p>
                Each score links to the commit, the JUnit artifact and the spec line it exercises.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-5 py-12 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-ink">
              Score your first run in about two minutes.
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              Create a workspace, generate a key, commit one workflow file.
            </p>
          </div>
          <Link to="/login">
            <Button variant="primary">
              Start free <ArrowRightIcon width={14} height={14} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
