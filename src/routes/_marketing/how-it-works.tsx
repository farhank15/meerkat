import { createFileRoute, Link } from '@tanstack/react-router'

import { Badge, Card, CardContent, CardHeader } from '@/components/ui/primitives'
import { ArrowRightIcon } from '@/components/ui/icons'

export const Route = createFileRoute('/_marketing/how-it-works')({
  component: HowItWorks,
})

const STEPS = [
  {
    step: '01',
    title: 'Run your suite',
    body: 'TestSprite executes your scenarios against a preview deployment and returns a JUnit report. Meerkat never runs the browser itself — it reads what your suite actually proved.',
  },
  {
    step: '02',
    title: 'Ingest the artifact',
    body: 'The workflow posts the report to Meerkat with a scoped API key. The parser extracts every testcase, its verdict, and the failure message.',
  },
  {
    step: '03',
    title: 'Score the evidence',
    body: 'Coverage is the share of SPEC.md scenarios a test actually exercises. Stability is the consistency across reruns. Pass rate counts meaningful passes only — vacuous assertions are excluded.',
  },
  {
    step: '04',
    title: 'Act on the verdict',
    body: 'When the score is trustworthy and red, the agent brief lists the failing assertions and the uncovered scenarios. The loop fixes application code — never the tests or the spec.',
  },
]

function HowItWorks() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-16">
      <div className="text-2xs font-medium uppercase tracking-wider text-accent">How it works</div>
      <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-ink">
        A green suite is a claim. Meerkat checks whether it was earned.
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
        Most CI systems report whether tests passed. That answer is only useful if the tests
        assert something meaningful. Meerkat scores the evidence behind the green.
      </p>

      <div className="mt-10 space-y-3">
        {STEPS.map((item) => (
          <Card key={item.step} className="flex gap-5 px-5 py-4">
            <span className="mono-nums text-xs font-semibold text-accent">{item.step}</span>
            <div>
              <h2 className="text-sm font-medium text-ink">{item.title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{item.body}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-12 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader title="Coverage" description="Weight 50%" />
          <CardContent className="text-xs leading-relaxed text-ink-muted">
            Scenarios from SPEC.md that at least one test exercises. A test named after a scenario
            does not count unless its assertions match.
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Stability" description="Weight 30%" />
          <CardContent className="text-xs leading-relaxed text-ink-muted">
            Agreement across reruns of the same commit. A test that flips is not evidence, even
            when it happens to pass.
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Meaningful pass rate" description="Weight 20%" />
          <CardContent className="text-xs leading-relaxed text-ink-muted">
            Passes that assert something. A test with no assertion, or one that only checks a
            selector exists, is excluded from the numerator.
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Badge tone="accent">TSI = 0.50·coverage + 0.30·stability + 0.20·pass-rate</Badge>
        <span className="text-2xs text-ink-subtle">Rounded half away from zero. Deterministic.</span>
      </div>

      <div className="mt-12 flex items-center gap-3">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-strong"
        >
          Start scoring your suite <ArrowRightIcon width={14} height={14} />
        </Link>
      </div>
    </div>
  )
}
