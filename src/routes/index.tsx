import { createFileRoute, Link } from '@tanstack/react-router'
import { DEMO_RUN } from '@/lib/store'
import { Container, Section, ScoreCard } from '@/components/site'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { tsi, coverage, stability, passRate } = DEMO_RUN.metric
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(16,185,129,0.10),transparent_70%)]"
        />
        <Container className="relative grid gap-14 py-20 sm:py-28 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Powered by TestSprite runs
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-neutral-50 sm:text-5xl">
              Your suite is green.
              <br />
              But is it{' '}
              <span className="bg-linear-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                meaningful?
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-neutral-400">
              Meerkat turns every TestSprite run into a single{' '}
              <span className="text-neutral-200">Test Strength Index</span> — blending
              coverage, stability, and meaningful pass-rate so you can see past a
              passing checkmark.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/runs"
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-neutral-950 transition-colors hover:bg-emerald-500"
              >
                View the demo scorecard
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                ['50%', 'Coverage weight'],
                ['30%', 'Stability weight'],
                ['20%', 'Pass-rate weight'],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="text-2xl font-semibold tabular-nums text-neutral-100">
                    {v}
                  </dt>
                  <dd className="mt-1 text-xs text-neutral-500">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:pl-6">
            <ScoreCard
              tsi={tsi}
              coverage={coverage}
              stability={stability}
              passRate={passRate}
              runId="run-demo-1"
              className="lg:scale-[1.03]"
            />
            <p className="mt-4 text-center text-xs text-neutral-600">
              Demo fixture — SV-TSI-01 · 60/67 coverage · 66/67 stability · 63/67
              meaningful
            </p>
          </div>
        </Container>
      </section>

      {/* How it works */}
      <Section id="how" className="border-t border-white/5">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps from a pull request to a verdict you trust"
          sub="No new test code. Meerkat rides on the runs TestSprite already produces."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Step
            n={1}
            title="Connect your repo"
            body="Link GitHub and install the TestSprite app. Every pull request gets its own preview deployment."
            icon={
              <path
                d="M9 12a3 3 0 0 1 3-3h3a3 3 0 0 1 0 6h-3m0 0a3 3 0 0 0-3 3m0-6a3 3 0 0 0-3 3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            }
          />
          <Step
            n={2}
            title="Tests run themselves"
            body="TestSprite explores and exercises your live preview, then posts a run back to the pull request."
            icon={
              <path
                d="M8 5v14l11-7z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            }
          />
          <Step
            n={3}
            title="Meerkat scores it"
            body="Each run becomes a TSI score with coverage traceability and a verdict-trust read."
            icon={
              <path
                d="M4 19V5m0 14h16M8 16l3-4 3 2 4-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            }
          />
        </div>
      </Section>

      {/* The TSI */}
      <Section id="tsi" className="border-t border-white/5 bg-neutral-900/30">
        <SectionHeading
          eyebrow="The TSI"
          title="One number, built from three honest signals"
          sub="A passing suite can still be hollow. The index weights what actually predicts reliability."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Feature
            weight="50%"
            title="Coverage"
            body="The fraction of your SPEC's requirement IDs that a test genuinely exercises — measured case-sensitively, with orphans flagged."
            icon={<ShieldIcon />}
          />
          <Feature
            weight="30%"
            title="Stability"
            body="Does the same code pass every time? Flaky runs are discounted, because a test you can't trust isn't a safety net."
            icon={<PulseIcon />}
          />
          <Feature
            weight="20%"
            title="Pass rate"
            body="Meaningful passes only. Vacuous assertions — the ones that pass without checking anything — don't count."
            icon={<CheckIcon />}
          />
        </div>
      </Section>

      {/* The Loop */}
      <Section id="loop" className="border-t border-white/5">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="The Loop"
              title="When a run regresses, the loop closes it"
              sub="Meerkat classifies the verdict, decides whether auto-remediation is safe, and proposes a fix — then re-runs to prove it's green."
            />
            <ul className="mt-8 space-y-4">
              {[
                ['Detect', 'A regression or spec-drift surfaces on a run.'],
                ['Classify', 'Verdict trust decides dispatch vs. manual review.'],
                ['Remediate', 'A fix is proposed, applied, and re-verified green.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-emerald-500/10 text-sm font-semibold text-emerald-400 ring-1 ring-emerald-400/20">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-medium text-neutral-100">{t}</div>
                    <div className="text-sm text-neutral-500">{d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-6">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
              Loop · demo run
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <Row k="PR" v="#12" />
              <Row k="Classification" v="regression" />
              <Row k="Action" v="fix proposed" />
              <Row k="Result" v="green" accent />
              <Row k="Fix commit" v="fix(meerkat): rounding rule" />
            </div>
            <Link
              to="/runs/$id"
              params={{ id: 'run-demo-1' }}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
            >
              Open the demo run →
            </Link>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <section className="border-t border-white/5 bg-linear-to-b from-neutral-900/40 to-neutral-950">
        <Container className="flex flex-col items-center gap-6 py-20 text-center">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-neutral-50 sm:text-4xl">
            Ship tests you can actually defend.
          </h2>
          <p className="max-w-xl text-neutral-400">
            See the demo scorecard, or sign in with the shared account to explore the
            dashboard.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/runs"
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-neutral-950 transition-colors hover:bg-emerald-500"
            >
              View the demo scorecard
            </Link>
            <Link
              to="/score"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/10"
            >
              How scoring works
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}

function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string
  title: string
  sub?: string
}) {
  return (
    <div className="max-w-2xl">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
        {eyebrow}
      </div>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-50 sm:text-3xl">
        {title}
      </h2>
      {sub && <p className="mt-3 text-neutral-400">{sub}</p>}
    </div>
  )
}

function Step({
  n,
  title,
  body,
  icon,
}: {
  n: number
  title: string
  body: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-400/20">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            {icon}
          </svg>
        </span>
        <span className="text-xs font-medium text-neutral-600">Step {n}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-neutral-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">{body}</p>
    </div>
  )
}

function Feature({
  weight,
  title,
  body,
  icon,
}: {
  weight: string
  title: string
  body: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-6">
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-400/20">
          {icon}
        </span>
        <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-neutral-400">
          {weight}
        </span>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-neutral-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">{body}</p>
    </div>
  )
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-neutral-500">{k}</span>
      <span className={accent ? 'font-medium text-emerald-400' : 'text-neutral-200'}>
        {v}
      </span>
    </div>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v5c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

function PulseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l2-6 4 12 2-6h6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l2.5 2.5L16 9" />
    </svg>
  )
}
