import { Link, createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '@/components/ui/layout'
import { Badge, Card, EmptyState, StatusBadge } from '@/components/ui/primitives'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { ActivityIcon } from '@/components/ui/icons'
import { listRunsFn } from '@/server/runs'

export const Route = createFileRoute('/_authed/_app/runs/')({
  loader: () => listRunsFn({ data: { limit: 100 } }),
  component: Runs,
})

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Deterministic UTC stamp — identical on the server and the client. */
function shortWhen(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')} UTC`
}

function Runs() {
  const runs = Route.useLoaderData()

  return (
    <>
      <PageHeader
        title="Runs"
        description="Every TestSprite wave ingested into this workspace. A dash means the verdict was withheld, never that the score was zero."
        actions={<Badge tone="neutral">{runs.length} run(s)</Badge>}
      />

      <div className="p-6">
        <Card>
          {runs.length === 0 ? (
            <EmptyState
              icon={<ActivityIcon />}
              title="No runs ingested"
              description="Runs arrive from CI once a project has an API key and the workflow is committed. There is no sample data in this workspace."
            />
          ) : (
            <Table caption="Runs in this workspace">
              <THead>
                <TR>
                  <TH>Run</TH>
                  <TH>Project</TH>
                  <TH>Commit</TH>
                  <TH>PR</TH>
                  <TH>Source</TH>
                  <TH>Environment</TH>
                  <TH>When</TH>
                  <TH align="right">TSI</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {runs.map((run) => (
                  <TR key={run.id}>
                    <TD>
                      <Link
                        to="/runs/$id"
                        params={{ id: run.id }}
                        className="font-mono text-xs text-accent hover:text-accent-strong"
                      >
                        {run.id.slice(0, 8)}
                      </Link>
                    </TD>
                    <TD className="text-ink">{run.projectName}</TD>
                    <TD className="font-mono text-2xs">{run.sha?.slice(0, 8) ?? '—'}</TD>
                    <TD className="text-2xs">{run.pr ? `#${run.pr}` : '—'}</TD>
                    <TD className="text-2xs">{run.source}</TD>
                    <TD className="text-2xs">
                      {run.environment ? (
                        <span className="rounded bg-surface-raised px-1.5 py-0.5 text-ink-subtle">{run.environment}</span>
                      ) : (
                        '—'
                      )}
                    </TD>
                    <TD className="whitespace-nowrap text-2xs">{shortWhen(run.startedAt ?? run.createdAt)}</TD>
                    <TD align="right" className="mono-nums font-medium text-ink">
                      {run.tsi == null ? <Badge tone="warn">withheld</Badge> : run.tsi}
                    </TD>
                    <TD>
                      <StatusBadge status={run.status} />
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
