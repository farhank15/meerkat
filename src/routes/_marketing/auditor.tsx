// Public Vacuous Auditor. This is the same audit the authed "Audit" tab runs,
// pointed at the public demo run so the evidence is verifiable without a
// session — header counts plus the row-level markers behind every finding.

import { Link, createFileRoute } from '@tanstack/react-router'

import { Alert, Badge, Card, CardHeader, Stat } from '@/components/ui/primitives'
import { ScoreCli } from '@/components/score-cli'
import { auditRun } from '@/lib/auditor'
import { computeTsi } from '@/lib/tsi'
import { getPublicRunFn } from '@/server/public'

export const Route = createFileRoute('/_marketing/auditor')({
  loader: async () => {
    const result = await getPublicRunFn({
      data: { slug: 'meerkat-demo', id: 'run-demo-1' },
    })
    return { result }
  },
  component: AuditorPage,
})

const SEVERITY_TONE = { high: 'danger', medium: 'warn', low: 'neutral' } as const

function AuditorPage() {
  const { result } = Route.useLoaderData()

  if (!result) {
    return (
      <div className="mx-auto w-full max-w-4xl px-5 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Vacuous Auditor</h1>
        <p className="mt-2 text-sm text-ink-muted">
          The demo run is not available right now. Open a public run from the{' '}
          <Link to="/share/$slug" params={{ slug: 'meerkat-demo' }} className="text-accent">
            scorecard
          </Link>{' '}
          instead.
        </p>
      </div>
    )
  }

  const { run, meta, project } = result
  const audit = auditRun(run)
  const testCases = run.testCases ?? []
  const coverage = run.metric?.coverage ?? 0
  const stability = run.metric?.stability ?? 0
  const passRate = run.metric?.passRate ?? 0
  const rawTsi = 100 * (0.5 * coverage + 0.3 * stability + 0.2 * passRate)
  const computedTsi = computeTsi({ coverage, stability, passRate })

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10">
      <header className="space-y-3">
        <Badge tone="accent">Vacuous Auditor</Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Did those passes assert anything?
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">
          A suite can be 100% green and still produce zero evidence. Every testcase below is
          classified from its own row in <span className="font-mono text-ink">testsprite-junit.xml</span>{' '}
          — meaningful, shallow, or vacuous — and each finding points at the rows that prove it.
        </p>
        <p className="text-2xs text-ink-subtle">
          {project.name} · run <span className="font-mono text-ink">{run.id}</span>
          {meta.sha ? (
            <>
              {' '}
              · commit <span className="font-mono text-ink">{meta.sha.slice(0, 8)}</span>
            </>
          ) : null}
        </p>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label="Testcases" value={audit.counts.total} hint="Rows in the report" />
        <Stat
          label="Meaningful passes"
          value={audit.counts.meaningfulPasses}
          hint="Passes that assert something"
          tone="ok"
        />
        <Stat
          label="Vacuous passes"
          value={audit.counts.vacuous}
          hint="Zero assertions"
          tone={audit.counts.vacuous > 0 ? 'danger' : 'neutral'}
        />
        <Stat
          label="Shallow passes"
          value={audit.counts.shallow}
          hint="Exactly one assertion (SV-ADQ-03)"
          tone={audit.counts.shallow > 0 ? 'warn' : 'neutral'}
        />
        <Stat label="Orphans" value={audit.counts.orphans} hint="No SPEC ID" />
        <Stat label="Spec gaps" value={audit.counts.gaps} hint="Uncovered scenarios" />
      </div>

      <p className="mt-3 text-2xs text-ink-subtle">
        Meaningful passes: {audit.counts.meaningfulPasses} of {audit.counts.total} testcases ·{' '}
        {audit.counts.vacuous} vacuous · {audit.counts.shallow} shallow · {audit.counts.orphans}{' '}
        orphan · {audit.counts.gaps} gap.
      </p>

      <div className="mt-4">
        <h2 className="text-sm font-semibold text-ink">Verdict-Trust Gate:</h2>
        <Alert
          tone={audit.state === 'trusted' ? 'ok' : audit.state === 'suspect' ? 'danger' : 'warn'}
          title={audit.headline}
        >
          {audit.rationale}
        </Alert>
      </div>

      <Card className="mt-4">
        <CardHeader
          title={`Findings (${audit.findings.length})`}
          description="Each finding names the exact rows behind it — no narrative without evidence."
        />
        {audit.findings.length === 0 ? (
          <p className="px-4 py-3 text-xs text-ink-muted">
            No findings: every pass asserts at least two steps and every row maps to a SPEC ID.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {audit.findings.map((finding) => (
              <li key={`${finding.kind}-${finding.title}`} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={SEVERITY_TONE[finding.severity]}>{finding.severity}</Badge>
                  <span className="font-mono text-2xs text-ink-subtle">{finding.kind}</span>
                  <span className="text-xs font-medium text-ink">{finding.title}</span>
                </div>
                <p className="mt-1 text-2xs leading-relaxed text-ink-muted">{finding.detail}</p>
                <ul className="mt-1.5 space-y-0.5">
                  {finding.evidence.map((row) => (
                    <li key={row} className="font-mono text-2xs text-ink-subtle">
                      └ {row}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-4" id="scoring-cli">
        <CardHeader
          title="Scoring workflow — half-up, step by step"
          description="Type the boundary inputs and read the exact weighted sum, the raw score, and the rounded TSI. Same engine as the CLI, no install required."
        />
        <div className="p-4">
          <ScoreCli />
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader
          title="Full-run report"
          description="Every testcase in the artifact, with the marker the auditor used to classify it."
        />
        <ul className="divide-y divide-line">
          {testCases.map((testCase, index) => (
            <li key={`${testCase.name}-${index}`}>
              <details>
                <summary className="cursor-pointer px-4 py-2 font-mono text-2xs text-ink">
                  └ {testCase.name} — {testCase.specId ?? 'orphan'} — {testCase.status}
                </summary>
                <div className="space-y-1 px-8 pb-3 text-2xs leading-relaxed text-ink-muted">
                  <p>
                    JUnit row {index + 1} of {testCases.length} in{' '}
                    <span className="font-mono text-ink">testsprite-junit.xml</span> · status{' '}
                    <span className="font-mono text-ink">{testCase.status}</span> · spec{' '}
                    <span className="font-mono text-ink">{testCase.specId ?? 'orphan'}</span>
                  </p>
                  <p>
                    Marker:{' '}
                    {testCase.status === 'failed'
                      ? 'failed — real defect, counted in the failure cluster'
                      : testCase.shallow
                        ? 'shallow (1 assertion) — flagged, pass rate unchanged (SV-ADQ-03)'
                        : testCase.specId
                          ? 'meaningful — asserts a contracted scenario'
                          : 'orphan — no SPEC ID, so it cannot cover a scenario'}
                  </p>
                  <p>
                    Score evidence: coverage {coverage.toFixed(3)} × 0.50 + stability{' '}
                    {stability.toFixed(3)} × 0.30 + pass rate {passRate.toFixed(3)} × 0.20 = raw{' '}
                    <span className="font-mono text-ink">{rawTsi.toFixed(3)}</span> → TSI{' '}
                    <span className="mono-nums font-semibold text-ink">{computedTsi}</span>{' '}
                    (half-up: 93.5 → 94, 95.4999 → 95)
                  </p>
                  <p>
                    <a href="#scoring-cli" className="font-medium text-accent hover:text-accent-strong">
                      Open the scoring workflow for this row →
                    </a>
                  </p>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
        <Link
          to="/share/$slug/run/$id"
          params={{ slug: 'meerkat-demo', id: 'run-demo-1' }}
          className="font-medium text-accent hover:text-accent-strong"
        >
          Open the full run →
        </Link>
        <Link to="/score" className="font-medium text-ink-muted hover:text-ink">
          How the score is computed
        </Link>
      </div>
    </div>
  )
}
