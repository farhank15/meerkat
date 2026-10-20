// Coverage detail: which SPEC.md scenarios this run actually exercised, and
// which ones are gaps. The table is the evidence — no score without it.

import { Fragment, useState } from 'react'
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
  const [openGap, setOpenGap] = useState<string | null>(null)
  const entries = run.specEntries ?? []
  const gaps = entries.filter((entry) => !entry.covered)
  const covered = entries.length - gaps.length
  const testCases = run.testCases ?? []
  const orphans = testCases.filter((tc) => !tc.specId)
  const pct = (v?: number) => (typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '—')

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
          <Stat label="Orphan tests" value={orphans.length} hint="Tests that assert no scenario" />
        </div>

        {gaps.length > 0 && (
          <Alert tone="warn" title={`${gaps.length} scenario gap(s)`}>
            A gap lowers coverage but does not fail the suite. It is the difference between “all
            tests pass” and “the behaviour is tested”. Click a gap row to open its spec
            traceability.
          </Alert>
        )}

        <Card>
          <CardHeader
            title="Spec coverage"
            description="Traceable to SPEC.md line by line. Gap rows expand to spec traceability."
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
                  <Fragment key={entry.id}>
                    <TR
                      role={!entry.covered ? 'button' : undefined}
                      aria-expanded={!entry.covered ? openGap === entry.id : undefined}
                      onClick={!entry.covered ? () => setOpenGap(openGap === entry.id ? null : entry.id) : undefined}
                      className={!entry.covered ? 'cursor-pointer hover:bg-surface-hover' : undefined}
                    >
                      <TD className="font-mono text-2xs text-ink">{entry.id}</TD>
                      <TD className="text-2xs">L{entry.specLine}</TD>
                      <TD className="font-mono text-2xs">{entry.testName ?? '—'}</TD>
                      <TD>
                        <Badge tone={entry.covered ? (entry.status === 'failed' ? 'danger' : 'ok') : 'warn'}>
                          {entry.covered ? (entry.status ?? 'covered') : 'gap'}
                        </Badge>
                      </TD>
                    </TR>
                    {!entry.covered && openGap === entry.id && (
                      <TR>
                        <TD colSpan={4} className="bg-surface px-4 py-3 align-top text-2xs text-ink-muted">
                          <p className="font-medium text-ink">Spec traceability</p>
                          <p className="mt-1">
                            SPEC.md line {entry.specLine} — {(entry as { asserts?: string }).asserts ?? entry.id}
                          </p>
                          <p className="mt-1">
                            This scenario is a gap: no testcase exercised it. It lowers coverage but
                            does not fail the suite. Open the spec to see the promised behaviour.
                          </p>
                        </TD>
                      </TR>
                    )}
                  </Fragment>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        {orphans.length > 0 && (
          <Card>
            <CardHeader
              title="Orphan tests"
              description={`${orphans.length} testcase(s) assert no SPEC scenario — visible, but not anchored to the contract.`}
            />
            <ul className="divide-y divide-line">
              {orphans.map((tc) => (
                <li key={tc.name} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="truncate font-mono text-2xs text-ink">{tc.name}</span>
                  <Badge tone={tc.status === 'failed' ? 'danger' : tc.status === 'passed' ? 'ok' : 'neutral'}>
                    {tc.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card>
          <CardHeader
            title="TSI source breakdown"
            description="The JUnit source behind the score — every testcase that feeds the meaningful pass rate."
          />
          <div className="px-4 py-3 text-xs leading-relaxed text-ink-muted">
            <p className="font-mono text-ink">TSI = 0.5·coverage + 0.3·stability + 0.2·passRate</p>
            <p className="mt-2">
              Coverage {pct(run.metric?.coverage)} (weight 50%) · Stability {pct(run.metric?.stability)} (weight 30%) ·
              Pass rate {pct(run.metric?.passRate)} (weight 20%)
            </p>
            <p className="mt-2 text-2xs text-ink-subtle">
              Source artifact: <span className="font-mono text-ink">testsprite-junit.xml</span> —{' '}
              {testCases.filter((tc) => tc.status === 'failed').length} failing testcase
              {testCases.filter((tc) => tc.status === 'failed').length === 1 ? '' : 's'} included below.
            </p>
          </div>
          <Table caption="Test cases (JUnit source)">
            <THead>
              <TR>
                <TH>Test</TH>
                <TH>Spec</TH>
                <TH>Status</TH>
                <TH>Shallow</TH>
                <TH>Vacuous</TH>
              </TR>
            </THead>
            <TBody>
              {testCases.map((tc) => (
                <TR key={tc.name}>
                  <TD className="font-mono text-2xs text-ink">{tc.name}</TD>
                  <TD className="font-mono text-2xs">{tc.specId ?? '—'}</TD>
                  <TD>
                    <Badge tone={tc.status === 'failed' ? 'danger' : tc.status === 'passed' ? 'ok' : 'neutral'}>
                      {tc.status}
                    </Badge>
                  </TD>
                  <TD className="text-2xs">{tc.shallow ? 'yes' : '—'}</TD>
                  <TD className="text-2xs">{tc.vacuous ? 'yes' : '—'}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    </>
  )
}
