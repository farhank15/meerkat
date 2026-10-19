import { createFileRoute, Link } from '@tanstack/react-router'
import { DEMO_RUN } from '@/lib/store'
import {
  Container,
  Section,
  ScoreCard,
  Eyebrow,
  Card,
  btnPrimary,
  btnSecondary,
} from '@/components/site'
import { DotPattern, Marquee, ShinyText, BorderBeam } from '@/components/magicui'
import meerkatLogo from '@/assets/meerkat.png'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { tsi, coverage, stability, passRate } = DEMO_RUN.metric
  return (
    <>
      {/* 1 · Hero — anchors byte-identical */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(16,185,129,0.10),transparent_70%)]"
        />
        <DotPattern className="opacity-30" />
        <Container className="relative grid gap-14 py-20 sm:py-28 lg:grid-cols-2 lg:items-center">
          <div>
            <img
              src={meerkatLogo}
              alt="Meerkat — sentinel for your test suite"
              width={72}
              height={72}
              className="h-18 w-18 rounded-2xl bg-neutral-950 object-contain shadow-[0_0_60px_-12px_rgba(16,185,129,0.45)] ring-1 ring-white/10"
            />
            <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Powered by TestSprite runs
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-neutral-50 sm:text-5xl">
              Your suite is green.
              <br />
              But is it{' '}
              <ShinyText className="font-bold">
                meaningful?
              </ShinyText>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-neutral-400">
              Meerkat turns every TestSprite run into a single{' '}
              <span className="text-neutral-200">Test Strength Index</span> — blending
              coverage, stability, and meaningful pass-rate so you can see past a
              passing checkmark.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/runs" className={btnPrimary}>
                View the demo scorecard
              </Link>
              <Link to="/login" className={btnSecondary}>
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

      {/* 2 · Evidence strip — decorative facts, anchors unchanged */}
      <div aria-hidden className="border-y border-white/5 bg-white/[0.02]">
        <Marquee className="py-3.5">
          {[
            'vacuous pass — green without a real assertion',
            'orphan test — gives no coverage',
            'silent gap — contracted scenario untested',
            'estimated stability — one run only',
            'n/a is not zero — a withheld verdict is honest',
            'coverage is a contract trace, not a percentage vibe',
            'live CI ledger — ten real PR waves ingested',
            'every score traceable to a commit SHA',
          ].map((t) => (
            <span key={t} className="font-mono text-[11px] text-neutral-600">
              <span className="mr-8 text-emerald-500/60">◆</span>
              {t}
            </span>
          ))}
        </Marquee>
      </div>

      {/* 3 · The honest problem — what a bare checkmark hides */}
      <Section id="problem" className="border-t border-white/5">
        <SectionHeading
          eyebrow="The honest problem"
          title="What a passing suite can hide"
          sub="Three failure modes survive a green build. TestSprite finds them; Meerkat makes them the headline instead of a footnote."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <ProblemCard
            title="The hollow pass"
            body="A testcase can click nothing and assert nothing, yet still report green. On this ledger a pass without evidence is flagged, not celebrated."
            icon={
              <path
                d="M12 8v5m0 3.5h.01M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            }
          />
          <ProblemCard
            title="The silent gap"
            body="Part of your SPEC.md was never exercised by any testcase. The suite stays green while a contracted scenario goes untested."
            icon={
              <path
                d="M4 18v-8m6 8V6m6 12v-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            }
          />
          <ProblemCard
            title="Estimated stability"
            body="One run of one commit says little. Without a second look the same green could be luck — so the ledger shows what the score can and cannot claim."
            icon={
              <path
                d="M3 12h4l2-6 4 12 2-6h6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            }
          />
        </div>
      </Section>

      {/* 4 · How it works — anchors byte-identical */}
      <Section id="how" className="border-t border-white/5 bg-neutral-900/30">
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

      {/* 5 · The TSI — anchors byte-identical */}
      <Section id="tsi" className="border-t border-white/5">
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

      {/* 6 · Live evidence band — published real facts only, no fetch */}
      <div id="evidence" className="border-y border-white/5 bg-neutral-950/60">
        <Container className="grid gap-8 py-14 sm:grid-cols-3 sm:text-center">
          {[
            ['10', 'real pull-request waves recorded in the live ledger, red flags included'],
            ['41', 'automated testcases in the current suite, exercising every core surface'],
            ['93 → 50', 'the honest gap between one contract-bound baseline and unbound CI flows'],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="text-4xl font-bold tabular-nums tracking-tight text-neutral-50">
                {v}
              </div>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-neutral-500">
                {l}
              </p>
            </div>
          ))}
        </Container>
      </div>

      {/* 7 · The Loop — anchors byte-identical */}
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
          <Card className="p-6">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
              Loop · demo run
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <Row k="PR" v="#12" />
              <Row k="Classification" v="regression" />
              <Row k="Action" v="fix proposed" />
              <Row k="Result" v="green" accent />
              <Row k="Fix commit" v="fix(meerkat): skip accounting + coverage counts" />
            </div>
            <Link
              to="/runs/$id"
              params={{ id: 'run-demo-1' }}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
            >
              Open the demo run →
            </Link>
          </Card>
        </div>
      </Section>

      {/* 8 · Agent-ready — machine channel of the same ledger */}
      <Section id="agents" className="border-t border-white/5 bg-neutral-900/30">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Agent-ready"
              title="The ledger your coding agent reads"
              sub="Same evidence trail, machine channel — no key, no login wall, no scraping. Human dashboard and AI agent see one truth."
            />
            <ul className="mt-8 space-y-4 text-sm">
              {[
                ['Public JSON ledger', 'One keyless endpoint returns the project brief: score, verdict state, coverage gaps.'],
                ['MCP on stdio', 'Four read-only tools ship in-repo: brief, gaps, run lookup, raw run data.'],
                ['Deterministic trace', 'Every number links back to a run id, a SPEC scenario, and a commit SHA.'],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <span aria-hidden className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-emerald-400" />
                  <div>
                    <span className="font-medium text-neutral-100">{t}</span>
                    <span className="text-neutral-500"> — {d}</span>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              to="/agent"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
            >
              Read the agent guide →
            </Link>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/70 p-6">
            <BorderBeam />
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
              Machine peek
            </div>
            <pre className="mt-4 overflow-x-auto font-mono text-[11px] leading-relaxed text-neutral-400">
              <code>{`$ curl meerkat-app.vercel.app/api/agent-brief

{
  "source": "live-ingested-run",
  "runId": "16bc32c1-…",
  "sha": "bb1fa9c7…",
  "tsi": 50,
  "coverage": { "covered": 0, "total": 33 },
  "verdictState": "green",
  "coverageGaps": [ { "id": "SV-TSI-01", … }, … ]
}

# MCP config for your coding agent
{
  "mcpServers": {
    "meerkat": { "command": "node", "args": ["mcp/server.mjs"] }
  }
}`}</code>
            </pre>
          </div>
        </div>
      </Section>

      {/* 9 · Comparison — bare checkmark vs the ledger */}
      <Section id="compare" className="border-t border-white/5">
        <SectionHeading
          eyebrow="Side by side"
          title="The checkmark you get vs. the ledger you can defend"
          sub="Both views exist today. Only one of them holds up in front of a skeptical reviewer."
        />
        <Card className="mt-10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-neutral-500">
                <th className="px-5 py-3.5 font-medium">What the bare checkmark shows</th>
                <th className="px-5 py-3.5 font-medium text-emerald-400/90">
                  What the Meerkat ledger shows
                </th>
              </tr>
            </thead>
            <tbody className="text-neutral-400">
              {[
                ['Pass/fail per testcase', 'Every pass audited: does it actually assert anything?'],
                ['Failures as loose lines', 'Failures bundled by shared root cause, with the rows named'],
                ['No contract view', 'SPEC.md scenario coverage with named gaps and line anchors'],
                ['Score disconnected from code', 'Each index pinned to one commit SHA, traceable both ways'],
                ['Green = ship', 'Green, incomplete, or refused — each verdict told apart honestly'],
              ].map(([bare, ledger]) => (
                <tr key={bare} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3.5">{bare}</td>
                  <td className="px-5 py-3.5 font-medium text-neutral-200">{ledger}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>

      {/* 10 · FAQ — native details, zero deps */}
      <Section id="faq" className="border-t border-white/5 bg-neutral-900/30">
        <SectionHeading
          eyebrow="Straight answers"
          title="The questions a careful reviewer actually asks"
          sub="Short, specific, and verifiable on the pages behind each link."
        />
        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          <Faq q="Why is a missing score shown as a dash, never a zero?">
            A run that did not finish is missing evidence, not a failing suite.
            Publishing zero would be a fabricated number, so the ledger explicitly
            shows withholding with the reason spelled out on the run page.
          </Faq>
          <Faq q="Where does the data come from?">
            From runs TestSprite itself produces on every pull request, persisted
            through a key-gated ingest endpoint into the project's Neon datastore,
            with the committed artifacts kept as a separate baseline board.
          </Faq>
          <Faq q="What happens when a testcase fails?">
            The verdict layer classifies it, and if a failure bundle exists the
            remediation flow proposes a fix, applies it, then re-runs to confirm
            the recovery — see the loop page for the working trail.
          </Faq>
          <Faq q="Can my coding agent read this without scraping the UI?">
            Yes — one keyless JSON endpoint plus four read-only MCP tools cover
            briefs, gaps, and run lookups. The full contract lives on the agent
            guide, click-to-copy.
          </Faq>
        </div>
      </Section>

      {/* 11 · CTA — anchors byte-identical */}
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
            <Link to="/runs" className={btnPrimary}>
              View the demo scorecard
            </Link>
            <Link to="/login" className={btnSecondary}>
              Sign in
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}

// ——— Landing primitives ———————————————————————————————————————————————

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
      <Eyebrow accent>{eyebrow}</Eyebrow>
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
    <Card className="p-6">
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
    </Card>
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
    <Card className="p-6">
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
    </Card>
  )
}

function ProblemCard({
  title,
  body,
  icon,
}: {
  title: string
  body: string
  icon: React.ReactNode
}) {
  return (
    <Card className="p-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-400/20">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          {icon}
        </svg>
      </span>
      <h3 className="mt-5 text-lg font-semibold text-neutral-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">{body}</p>
    </Card>
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

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-white/10 bg-neutral-900/50 px-5 transition-colors open:border-emerald-500/20 open:bg-neutral-900/70">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-neutral-100 [&::-webkit-details-marker]:hidden">
        {q}
        <svg
          viewBox="0 0 12 12"
          className="h-3 w-3 flex-none text-neutral-500 transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="M2 4l4 4 4-4" strokeLinecap="round" />
        </svg>
      </summary>
      <p className="pb-5 text-sm leading-relaxed text-neutral-400">{children}</p>
    </details>
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
