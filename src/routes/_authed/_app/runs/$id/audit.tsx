// Verdict-trust audit: does the green mean anything? Findings are grouped and
// ranked, never invented — every row traces back to a testcase in the artifact.

import { createFileRoute, notFound } from '@tanstack/react-router'

import { PageHeader } from '@/components/ui/layout'
import { RunTabs } from '@/components/run-tabs'
import { Alert, Badge, Card, CardContent, CardHeader, Stat } from '@/components/ui/primitives'
import { EscalationPanel } from '@/components/escalation-panel'
import { auditRun, clusterFailures } from '@/lib/auditor'
import { getRunFn } from '@/server/runs'

export const Route = createFileRoute('/_authed/_app/runs/$id/audit')({
  loader: async ({ params }) => {
    const result = await getRunFn({ data: { id: params.id } })
    if (!result) throw notFound()
    return result
  },
  component: AuditPage,
})

const SEVERITY_TONE = { high: 'danger', medium: 'warn', low: 'neutral' } as const

function AuditPage() {
  const { id, run } = Route.useLoaderData()
  const audit = auditRun(run)
  const clusters = clusterFailures(run.testCases ?? [])

  return (
    <>
      <PageHeader
        title={`Audit · ${id.slice(0, 8)}`}
        breadcrumbs={[
          { label: 'Runs', to: '/runs' },
          { label: id.slice(0, 8), to: '/runs/$id', params: { id } },
          { label: 'Audit' },
        ]}
        description={`Meaningful passes: ${audit.counts.meaningfulPasses} of ${audit.counts.total} testcases · the trust gate cross-checks the verdict against vacuous passes, orphans, conflicts and gaps.`}
      />
      <RunTabs id={id} />

      <div className="space-y-4 p-6">
        <Alert
          tone={audit.state === 'trusted' ? 'ok' : audit.state === 'suspect' ? 'danger' : 'warn'}
          title={audit.headline}
        >
          {audit.rationale}
        </Alert>

        {run.loop?.classification === 'spec-drift' && (
          <Alert tone="warn" title="Spec drift — update the test or the spec">
            This run is classified as <span className="font-medium text-ink">spec drift</span>: the
            behaviour and the SPEC.md contract disagree. Resolve it by updating the test to match
            the spec, updating the spec to match the behaviour, or both. A drifted scenario is not
            trusted until reconciled.
          </Alert>
        )}

        {run.verdict && typeof run.verdict.refused === 'number' && run.verdict.refused > 0 && (
          <Alert
            tone="warn"
            title={`Incomplete rerun — ${run.verdict.refused} of ${run.verdict.requested ?? '?'} testcases refused`}
          >
            The rerun did not complete: {run.verdict.completed ?? '?'} of{' '}
            {run.verdict.requested ?? '?'} testcases finished and {run.verdict.refused} refused to
            execute (the target deployment was replaced mid-run). The verdict reflects only the
            evidence that did run — it is never extrapolated.
          </Alert>
        )}

        <Card>
          <CardHeader
            title="Verdict-Trust Gate:"
            description="The gate cross-checks the green verdict before it is trusted — a red or held run never reports green."
          />
          <div className="flex items-start gap-3 px-4 py-3">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              role="img"
              aria-label="trust gate badge"
              className="mt-0.5 shrink-0 text-ok"
            >
              <path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" opacity=".15" />
              <path fill="none" stroke="currentColor" strokeWidth="1.6" d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" />
              <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="m8.5 12 2.2 2.2 4.8-4.8" />
            </svg>
            <div className="text-xs leading-relaxed text-ink-muted">
              {audit.headline} — {audit.rationale}
            </div>
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          <Stat label="Test cases" value={audit.counts.total} hint="In this run" />
          <Stat label="Vacuous passes" value={audit.counts.vacuous} hint="Excluded from the pass rate" tone={audit.counts.vacuous ? 'warn' : 'neutral'} />
          <Stat label="Shallow passes" value={audit.counts.shallow} hint="1 assertion — flagged, pass rate unchanged" tone={audit.counts.shallow ? 'warn' : 'neutral'} />
          <Stat label="Orphans" value={audit.counts.orphans} hint="No owning scenario" />
          <Stat label="Conflicts" value={audit.counts.conflicted} hint="Same scenario, different verdicts" tone={audit.counts.conflicted ? 'danger' : 'neutral'} />
          <Stat label="Spec gaps" value={audit.counts.gaps} hint="Uncovered scenarios" />
          <Stat label="Meaningful passes" value={audit.counts.meaningfulPasses} hint="Asserted, non-vacuous" tone="ok" />
        </div>

        <Card>
          <CardHeader
            title="TSI source breakdown"
            description="The JUnit artifact behind the score — every testcase that fed the meaningful pass rate."
          />
          <p className="px-4 pt-3 text-2xs text-ink-subtle">
            Source artifact: <span className="font-mono text-ink">testsprite-junit.xml</span> ·{' '}
            {(run.testCases ?? []).filter((tc) => tc.status === 'failed').length} failing testcase
            {(run.testCases ?? []).filter((tc) => tc.status === 'failed').length === 1 ? '' : 's'} ·{' '}
            {(run.testCases ?? []).length} total
          </p>
          <ul className="mt-2 space-y-0.5 px-4 pb-3">
            {(run.testCases ?? []).map((tc) => (
              <li key={tc.name} className="font-mono text-2xs text-ink-subtle">
                └ {tc.name} — {tc.specId ?? 'orphan'} — {tc.status}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Findings" description={`${audit.findings.length} finding(s)`} />
          {audit.findings.length === 0 ? (
            <CardContent className="text-xs text-ink-muted">
              No findings. Every pass asserts an owned scenario and every scenario is covered.
            </CardContent>
          ) : (
            <ul className="divide-y divide-line">
              {audit.findings.map((finding) => (
                <li key={`${finding.kind}-${finding.title}`} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-medium text-ink">{finding.title}</h3>
                      <p className="mt-0.5 text-2xs leading-relaxed text-ink-muted">{finding.detail}</p>
                    </div>
                    <Badge tone={SEVERITY_TONE[finding.severity]}>{finding.severity}</Badge>
                  </div>
                      {finding.evidence.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                          {finding.evidence.slice(0, 6).map((item) => (
                            <li key={item} className="font-mono text-2xs text-ink-subtle">
                              └ {item}
                            </li>
                          ))}
                          {finding.evidence.length > 6 && (
                            <li className="text-2xs text-ink-subtle">
                              └ +{finding.evidence.length - 6} more
                            </li>
                          )}
                        </ul>
                      )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {clusters.length > 0 && (
          <Card>
            <CardHeader title="Failure clusters" description="Grouped by shared cause, not by test name." />
            <CardContent className="space-y-2">
              {clusters.map((cluster) => (
                <div key={cluster.label} className="rounded-md border border-line bg-canvas px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-2xs font-medium text-ink">{cluster.label}</span>
                    <Badge tone="danger">{cluster.count}</Badge>
                  </div>
                  <p className="mt-1 font-mono text-2xs text-ink-subtle">
                    {cluster.names.slice(0, 3).join(' · ')}
                    {cluster.names.length > 3 ? ` +${cluster.names.length - 3}` : ''}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <EscalationPanel escalations={run.escalations} />
      </div>
    </>
  )
}
