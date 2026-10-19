// The standalone scoring surface. Documents Meerkat's CLI contract (the
// deterministic scorer behind every run) and showcases the primary fixture so
// the determinism and exit-code behaviour are verifiable without a live run.

import { createFileRoute, Link } from '@tanstack/react-router'

import { Card, CardHeader, Stat, Badge, Button } from '@/components/ui/primitives'
import { ArrowRightIcon } from '@/components/ui/icons'

export const Route = createFileRoute('/_marketing/score')({
  component: ScorePage,
})

const CLI_COMMAND = 'npx suitevitals score --junit testsprite-junit.xml --spec SPEC.md'

function ScorePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10">
      <header className="space-y-3">
        <Badge tone="accent">CLI contract</Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Score any TestSprite run</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">
          Every run is scored by one deterministic command. The same inputs produce
          byte-identical output, so a green badge means exactly what it says. The contract
          below is what the scorer honours on every invocation.
        </p>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="The command" description="The single entry point to the scorer." />
          <div className="space-y-3 px-4 py-3">
            <pre className="overflow-x-auto rounded-md border border-line bg-canvas px-3 py-2 font-mono text-2xs text-ink">
              {CLI_COMMAND}
            </pre>
            <p className="text-2xs leading-relaxed text-ink-subtle">
              Exit 0 scored · Exit 2 missing argument · Exit 3 missing file. Malformed XML
              reports are rejected, never crashed through. Repeating the command with
              identical inputs produces a byte-identical result.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Exit codes" description="Documented for every invocation." />
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line text-2xs">
            <div className="bg-surface px-3 py-2">
              <dt className="text-ink-subtle">Exit 0</dt>
              <dd className="mt-0.5 font-mono text-ink">scored</dd>
            </div>
            <div className="bg-surface px-3 py-2">
              <dt className="text-ink-subtle">Exit 2</dt>
              <dd className="mt-0.5 font-mono text-ink">missing argument</dd>
            </div>
            <div className="bg-surface px-3 py-2">
              <dt className="text-ink-subtle">Exit 3</dt>
              <dd className="mt-0.5 font-mono text-ink">missing file</dd>
            </div>
            <div className="bg-surface px-3 py-2">
              <dt className="text-ink-subtle">Determinism</dt>
              <dd className="mt-0.5 font-mono text-ink">byte-identical</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Primary fixture"
          description="The documented SPEC.md + testsprite-junit.xml pair, scored end to end."
        />
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Test Strength Index" value="93" hint="Deterministic score" tone="ok" />
          <Stat label="Coverage" value="30/33" hint="Weight 50%" />
          <Stat label="Stability" value="97%" hint="Weight 30%" />
          <Stat label="Meaningful pass rate" value="94%" hint="Weight 20%" />
        </div>
        <p className="px-4 pb-4 text-2xs leading-relaxed text-ink-subtle">
          The same fixture scored twice returns byte-identical JSON — no timestamp inside
          the value. That is the guarantee behind every green badge Meerkat issues.
        </p>
      </Card>

      <Card className="mt-4">
        <CardHeader
          title="Verdict-Trust Gate"
          description="Every green verdict is cross-checked before it is trusted — a red or held run never reports green."
        />
        <div className="flex items-center gap-3 px-4 py-3">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            role="img"
            aria-label="trust gate badge"
            className="shrink-0 text-ok"
          >
            <path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" opacity=".15" />
            <path fill="none" stroke="currentColor" strokeWidth="1.6" d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" />
            <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="m8.5 12 2.2 2.2 4.8-4.8" />
          </svg>
          <div className="text-xs leading-relaxed text-ink-muted">
            <p className="font-medium text-ink">Verdict: green (cross-checked)</p>
            <p>
              A failed fix attempt is escalated to a human instead of being forced green. The gate
              reports failures as-is — it never manufactures a passing score.
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link to="/docs">
          <Button variant="primary" size="sm">
            Full CLI reference <ArrowRightIcon width={12} height={12} />
          </Button>
        </Link>
        <Link to="/how-it-works" className="text-2xs font-medium text-accent hover:text-accent-strong">
          See the worked example
        </Link>
      </div>
    </div>
  )
}
