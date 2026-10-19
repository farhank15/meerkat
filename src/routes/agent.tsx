// Public guide: how any coding agent (or human) reads Meerkat's verdict layer.
// Everything here is read-only — the only write path into Meerkat is the
// key-gated POST /api/runs ingest, which agents never touch.

import { createFileRoute, Link } from '@tanstack/react-router'
import { Container } from '@/components/site'
import { MagicCard, ShinyText } from '@/components/magicui'

export const Route = createFileRoute('/agent')({
  component: AgentPage,
})

const BRIEF_URL = 'https://meerkat-app.vercel.app/api/agent-brief'

const TOOLS: Array<{ name: string; what: string }> = [
  {
    name: 'get_run_verdict',
    what: 'Latest verdict — TSI, state (green / failed / incomplete), and which board it came from (live ingested run or committed baseline evidence).',
  },
  {
    name: 'get_coverage_gaps',
    what: 'SPEC.md-scenario IDs with no asserting test, plus guidance to write a real test instead of weakening the scenario.',
  },
  {
    name: 'get_vacuous_findings',
    what: 'Assertion-quality verdict — vacuous passes, orphans, and conflicts, so an agent prioritises re-anchoring over re-running.',
  },
  {
    name: 'get_tsi_summary',
    what: 'Full agent brief — everything above plus source, SHA, PR, run link, and the scorecard/badge URLs.',
  },
]

function AgentPage() {
  return (
    <Container className="py-12">
      <div className="rounded-3xl border border-white/5 bg-neutral-950/40 px-6 py-10 sm:px-10">
        <div className="relative">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-50">For agents</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-400">
            Meerkat is a <ShinyText className="font-medium">verdict ledger</ShinyText> your
            coding agent can read before acting: a strength score, an evidence trail, and an
            interpretation for every TestSprite run — not a replacement for TestSprite, a
            consumer of its results.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
              read-only by construction
            </span>
            <span className="rounded-full border border-white/10 px-2.5 py-1">
              plain JSON · no client library
            </span>
            <span className="rounded-full border border-white/10 px-2.5 py-1">
              4 MCP tools
            </span>
          </div>
        </div>
      </div>

      {/* What the ledger holds — the feature surface an agent (or human) sees. */}
      <section className="mt-12">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          What sits on the ledger
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MagicCard>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">TSI score</div>
            <p className="mt-2 text-sm text-neutral-400">
              One number from coverage (50%) + stability (30%) + meaningful pass-rate (20%),
              with the full source breakdown shown on every scorecard.
            </p>
          </MagicCard>
          <MagicCard>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Two evidence boards</div>
            <p className="mt-2 text-sm text-neutral-400">
              Committed baseline artifacts and live CI-ingested runs stay side by side —
              never blurred, so every number is traceable to its source.
            </p>
          </MagicCard>
          <MagicCard>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Coverage traceability</div>
            <p className="mt-2 text-sm text-neutral-400">
              Every SPEC.md scenario mapped to the test that asserts it — gaps and orphans
              are named, not guessed.
            </p>
          </MagicCard>
          <MagicCard>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Vacuous Auditor</div>
            <p className="mt-2 text-sm text-neutral-400">
              Passes that assert nothing, orphan tests, and spec conflicts get labels —
              green that proves nothing does not count.
            </p>
          </MagicCard>
          <MagicCard>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Verdict-Trust Gate</div>
            <p className="mt-2 text-sm text-neutral-400">
              A failed run is never silently green; an incomplete rerun stays neutral. The
              gate decides what may ship.
            </p>
          </MagicCard>
          <MagicCard>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Proof badge</div>
            <p className="mt-2 text-sm text-neutral-400">
              One SVG embed for the README — the live sign, backed by the ledger, updated
              automatically from the latest ingested run.
            </p>
          </MagicCard>
        </div>
      </section>

      {/* Two ways in: raw JSON or MCP tools. Both hit the same public endpoint. */}
      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-5">
          <h2 className="text-sm font-semibold text-neutral-100">1 · Read the ledger</h2>
          <p className="mt-2 text-sm text-neutral-400">
            One GET returns the current verdict, coverage gaps, and assertion-quality
            findings as plain JSON — no auth needed for reads.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-white/5 bg-neutral-950 p-3 font-mono text-[11px] leading-relaxed text-neutral-300">
{`curl -s ${BRIEF_URL} | jq`}
          </pre>
          <a
            href={BRIEF_URL}
            target="_blank"
            rel="noreferrer"
            className="group mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition-colors hover:border-emerald-400/60 hover:bg-emerald-500/20"
          >
            Open the live JSON <span className="transition-transform group-hover:translate-x-0.5">↗</span>
          </a>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-5">
          <h2 className="text-sm font-semibold text-neutral-100">2 · Native MCP tools</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Drop this into your MCP host config — the server is read-scope by construction
            (HTTP only, no database credentials, no write access):
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-white/5 bg-neutral-950 p-3 font-mono text-[11px] leading-relaxed text-neutral-300">
{`"mcpServers": {
  "meerkat-verdict": {
    "command": "node",
    "args": ["<repo>/mcp/server.mjs"]
  }
}`}
          </pre>
          <p className="mt-3 text-xs text-neutral-500">
            Clone the repo (or vendor the one file), point <span className="font-mono">MEERKAT_API_URL</span>{' '}
            at a reachable base — it already points at production.
          </p>
        </div>
      </section>

      {/* Tool contract table. */}
      <section className="mt-12">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Tool contract
        </h2>
        <div className="mt-4 divide-y divide-white/5 rounded-2xl border border-white/10 bg-neutral-900/50">
          {TOOLS.map((tool) => (
            <div key={tool.name} className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6">
              <code className="shrink-0 font-mono text-xs text-emerald-300 sm:w-44 sm:pt-0.5">
                {tool.name}
              </code>
              <p className="text-sm text-neutral-400">{tool.what}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          Every tool degrades gracefully: if the ledger is unreachable, the agent gets a
          retryable error — never a silent guess.
        </p>
      </section>

      {/* Where this fits in the loop. */}
      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            When a run fails
          </div>
          <p className="mt-2 text-sm text-neutral-400">
            The agent calls <span className="font-mono text-xs">get_run_verdict</span>, reads
            the failing evidence, and fixes the root cause — not the checklist symptom.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            When coverage is thin
          </div>
          <p className="mt-2 text-sm text-neutral-400">
            <span className="font-mono text-xs">get_coverage_gaps</span> names the SPEC.md
            scenarios with no asserting test, so new tests target contract behaviour.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            When a suite lies
          </div>
          <p className="mt-2 text-sm text-neutral-400">
            <span className="font-mono text-xs">get_vacuous_findings</span> surfaces vacuous
            passes, orphans, and conflicts — green that proves nothing gets labelled.
          </p>
        </div>
      </section>

      <p className="mt-10 text-sm text-neutral-500">
        See the full story on the{' '}
        <Link to="/" className="text-emerald-400 transition-colors hover:text-emerald-300">
          landing page
        </Link>
        {' '}or in the repo README. Reads are public; writes are operator-only.
      </p>
    </Container>
  )
}
