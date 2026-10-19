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
    note: 'Input: JUnit XML + the SPEC.md contract.',
  },
  {
    step: '02',
    title: 'Ingest the artifact',
    body: 'The workflow posts the report to Meerkat with a scoped API key. The parser extracts every testcase, its verdict, and the failure message, then dedupes on commit and wave start.',
    note: 'A repeated upload of the same wave does not double-count.',
  },
  {
    step: '03',
    title: 'Score the evidence',
    body: 'Coverage is the share of SPEC.md scenarios a test actually exercises. Stability is the consistency across reruns. Pass rate counts meaningful passes only — vacuous assertions are excluded.',
    note: 'Weights are fixed and the result is rounded half away from zero.',
  },
  {
    step: '04',
    title: 'Act on the verdict',
    body: 'When the score is trustworthy and red, the agent brief lists the failing assertions and the uncovered scenarios. The loop fixes application code — never the tests or the spec.',
    note: 'A refusal or an incomplete rerun produces no fix at all.',
  },
]

const WEIGHTS = [
  {
    title: 'Coverage',
    weight: 50,
    body: 'Scenarios from SPEC.md that at least one test exercises. A test named after a scenario does not count unless its assertions match.',
  },
  {
    title: 'Stability',
    weight: 30,
    body: 'Agreement across reruns of the same commit. A test that flips is not evidence, even when it happens to pass.',
  },
  {
    title: 'Meaningful pass rate',
    weight: 20,
    body: 'Passes that assert something. A test with no assertion, or one that only checks a selector exists, is excluded from the numerator.',
  },
]

const VERDICTS = [
  {
    state: 'green',
    meaning: 'The run completed and the score is trusted.',
    consequence: 'The ratchet compares it with the main baseline.',
  },
  {
    state: 'failed',
    meaning: 'At least one testcase failed.',
    consequence: 'The score is computed, but the merge stays blocked until it is fixed or shown to be drift.',
  },
  {
    state: 'incomplete',
    meaning: 'A rerun asked for N tests and fewer than N finished.',
    consequence: 'The score is withheld. The check is neutral, not red.',
  },
  {
    state: 'refused',
    meaning: 'The target deployment changed while the run was executing.',
    consequence: 'Labelled refused, never counted as a failure, never auto-fixed.',
  },
]

const REFUSALS = [
  'It does not invent a score when there is no run. A missing run is a dash, not a zero.',
  'It does not count a test as coverage because its name contains a scenario ID — the assertions must match.',
  'It does not retry a refused run more than once, and it never edits the test to make a red run green.',
  'It does not read another workspace. Every query is scoped to the signed-in tenant.',
]

function HowItWorks() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-16">
      <div className="text-2xs font-medium uppercase tracking-wider text-accent">How it works</div>
      <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-ink">
        A green suite is a claim. Meerkat checks whether it was earned.
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
        Most CI systems report whether tests passed. That answer is only useful if the tests assert
        something meaningful. Meerkat scores the evidence behind the green, then hands the same
        evidence to the people and agents who act on it.
      </p>

      <div className="mt-10 space-y-3">
        {STEPS.map((item) => (
          <Card key={item.step} className="flex gap-5 px-5 py-4">
            <span className="mono-nums text-xs font-semibold text-accent">{item.step}</span>
            <div>
              <h2 className="text-sm font-medium text-ink">{item.title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{item.body}</p>
              <p className="mt-2 text-2xs text-ink-subtle">{item.note}</p>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="mt-14 text-lg font-semibold tracking-tight text-ink">The three signals</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {WEIGHTS.map((item) => (
          <Card key={item.title}>
            <CardHeader title={item.title} description={`Weight ${item.weight}%`} />
            <CardContent className="text-xs leading-relaxed text-ink-muted">
              {item.body}
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                <div className="h-full rounded-full bg-accent" style={{ width: `${item.weight}%` }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Badge tone="accent">TSI = 0.50·coverage + 0.30·stability + 0.20·pass-rate</Badge>
        <span className="text-2xs text-ink-subtle">Rounded half away from zero. Deterministic.</span>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Worked example — SV-TSI-01"
          description="The committed baseline, from SPEC.md and testsprite-junit.xml."
        />
        <CardContent>
          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-subtle">Coverage</dt>
              <dd className="font-mono text-ink-muted">30/33 = 0.909091</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-subtle">Stability</dt>
              <dd className="font-mono text-ink-muted">65/67 = 0.970149</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-subtle">Pass rate</dt>
              <dd className="font-mono text-ink-muted">63/67 = 0.940299</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-subtle">Weighted sum</dt>
              <dd className="font-mono text-ink-muted">93.365…</dd>
            </div>
          </dl>
          <p className="mt-3 border-t border-line pt-3 text-xs text-ink-muted">
            Rounded half away from zero →{' '}
            <span className="mono-nums font-semibold text-ink">93</span>. Re-run it with the same
            input and you get the same bytes.
          </p>
        </CardContent>
      </Card>

      <h2 className="mt-14 text-lg font-semibold tracking-tight text-ink">What a verdict means</h2>
      <div className="mt-4 overflow-hidden rounded-lg border border-line">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-raised text-2xs uppercase tracking-wider text-ink-subtle">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">State</th>
              <th scope="col" className="px-4 py-2 font-medium">Meaning</th>
              <th scope="col" className="px-4 py-2 font-medium">Consequence</th>
            </tr>
          </thead>
          <tbody>
            {VERDICTS.map((verdict) => (
              <tr key={verdict.state} className="border-t border-line">
                <td className="px-4 py-2.5 font-mono text-2xs text-ink">{verdict.state}</td>
                <td className="px-4 py-2.5 text-ink-muted">{verdict.meaning}</td>
                <td className="px-4 py-2.5 text-ink-muted">{verdict.consequence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-14 text-lg font-semibold tracking-tight text-ink">What Meerkat refuses to do</h2>
      <ul className="mt-4 space-y-2">
        {REFUSALS.map((item) => (
          <li key={item} className="flex gap-2.5 text-xs leading-relaxed text-ink-muted">
            <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-12 flex flex-wrap items-center gap-4">
        <Link to="/login" search={{ mode: 'register' }}>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-strong">
            Start scoring your suite <ArrowRightIcon width={14} height={14} />
          </span>
        </Link>
        <Link to="/docs" className="text-sm font-medium text-ink-muted hover:text-ink">
          Read the setup guide
        </Link>
      </div>
    </div>
  )
}
