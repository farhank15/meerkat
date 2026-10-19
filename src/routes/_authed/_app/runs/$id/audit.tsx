// Verdict-trust audit: does the green mean anything? Findings are grouped and
// ranked, never invented — every row traces back to a testcase in the artifact.

import { createFileRoute, notFound } from '@tanstack/react-router'

import { PageHeader } from '@/components/ui/layout'
import { RunTabs } from '@/components/run-tabs'
import { Alert, Badge, Card, CardContent, CardHeader, Stat } from '@/components/ui/primitives'
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
        description="The trust gate cross-checks the verdict against vacuous passes, orphans, conflicts and gaps."
      />
      <RunTabs id={id} />

      <div className="space-y-4 p-6">
        <Alert
          tone={audit.state === 'trusted' ? 'ok' : audit.state === 'suspect' ? 'danger' : 'warn'}
          title={audit.headline}
        >
          {audit.rationale}
        </Alert>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Stat label="Vacuous passes" value={audit.counts.vacuous} hint="Excluded from the pass rate" tone={audit.counts.vacuous ? 'warn' : 'neutral'} />
          <Stat label="Shallow passes" value={audit.counts.shallow} hint="1 assertion — flagged, pass rate unchanged" tone={audit.counts.shallow ? 'warn' : 'neutral'} />
          <Stat label="Orphans" value={audit.counts.orphans} hint="No owning scenario" />
          <Stat label="Conflicts" value={audit.counts.conflicted} hint="Same scenario, different verdicts" tone={audit.counts.conflicted ? 'danger' : 'neutral'} />
          <Stat label="Spec gaps" value={audit.counts.gaps} hint="Uncovered scenarios" />
        </div>

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
                          {item}
                        </li>
                      ))}
                      {finding.evidence.length > 6 && (
                        <li className="text-2xs text-ink-subtle">
                          +{finding.evidence.length - 6} more
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
      </div>
    </>
  )
}
