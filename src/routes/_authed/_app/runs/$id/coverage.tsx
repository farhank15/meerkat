// Coverage detail: which SPEC.md scenarios this run actually exercised, and
// which ones are gaps. The table is the evidence — no score without it.

import { createFileRoute, notFound } from '@tanstack/react-router'

import { PageHeader } from '@/components/ui/layout'
import { RunTabs } from '@/components/run-tabs'
import { Alert, Badge, Card, CardHeader, EmptyState, Stat } from '@/components/ui/primitives'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { getRunFn } from '@/server/runs'

export const Route = createFileRoute('/_authed/_app/runs/$id/coverage')({
  loader: async ({ params }) => {
    const result = await getRunFn({ data: { id: params.id } })
    if (!result) throw notFound()
    return result
  },
  component: CoveragePage,
})

function CoveragePage() {
  const { id, run } = Route.useLoaderData()
  const entries = run.specEntries ?? []
  const gaps = entries.filter((entry) => !entry.covered)
  const covered = entries.length - gaps.length

  return (
    <>
      <PageHeader
        title={`Coverage · ${id.slice(0, 8)}`}
        breadcrumbs={[{ label: 'Runs', to: '/runs' }, { label: id.slice(0, 8), to: '/runs/$id', params: { id } }, { label: 'Coverage' }]}
        description="Each row is a scenario in the spec contract. Covered means a test exercised it and asserted something."
      />
      <RunTabs id={id} />

      <div className="space-y-4 p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Covered" value={`${covered}/${entries.length}`} hint="Scenarios exercised" tone="ok" />
          <Stat label="Gaps" value={gaps.length} hint="No test exercises these" tone={gaps.length ? 'warn' : 'neutral'} />
          <Stat
            label="Orphan tests"
            value={(run.testCases ?? []).filter((testCase) => !testCase.specId).length}
            hint="Tests that assert no scenario"
          />
        </div>

        {gaps.length > 0 && (
          <Alert tone="warn" title={`${gaps.length} scenario gap(s)`}>
            A gap lowers coverage but does not fail the suite. It is the difference between “all
            tests pass” and “the behaviour is tested”.
          </Alert>
        )}

        <Card>
          <CardHeader
            title="Spec coverage"
            description="Traceable to SPEC.md line by line."
            action={<Badge tone="neutral">{entries.length} scenario(s)</Badge>}
          />
          {entries.length === 0 ? (
            <EmptyState
              title="No spec contract in this run"
              description="The ingest payload did not include SPEC.md scenarios. Coverage cannot be scored without them."
            />
          ) : (
            <Table caption="Scenario coverage">
              <THead>
                <TR>
                  <TH>Scenario</TH>
                  <TH>SPEC.md</TH>
                  <TH>Covering test</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {entries.map((entry) => (
                  <TR key={entry.id}>
                    <TD className="font-mono text-2xs text-ink">{entry.id}</TD>
                    <TD className="text-2xs">L{entry.specLine}</TD>
                    <TD className="font-mono text-2xs">{entry.testName ?? '—'}</TD>
                    <TD>
                      <Badge tone={entry.covered ? (entry.status === 'failed' ? 'danger' : 'ok') : 'warn'}>
                        {entry.covered ? (entry.status ?? 'covered') : 'gap'}
                      </Badge>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  )
}
