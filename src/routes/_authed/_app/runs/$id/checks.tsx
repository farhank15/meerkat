// PR Checks tab (SV-RAT-06): the two GitHub checks that gate every pull
// request, exposed as a first-class run section rather than an overview panel.

import { createFileRoute, notFound } from '@tanstack/react-router'

import { PageHeader } from '@/components/ui/layout'
import { RunTabs } from '@/components/run-tabs'
import { PrChecksPanel } from '@/components/pr-checks-panel'
import { getRunFn } from '@/server/runs'

import ratchetBaseline from '@/../baseline/tsi.json'

export const Route = createFileRoute('/_authed/_app/runs/$id/checks')({
  loader: async ({ params }) => {
    const result = await getRunFn({ data: { id: params.id } })
    if (!result) throw notFound()
    return result
  },
  component: ChecksPage,
})

function ChecksPage() {
  const { id } = Route.useLoaderData()
  return (
    <>
      <PageHeader
        title={`PR Checks · ${id.slice(0, 8)}`}
        breadcrumbs={[
          { label: 'Runs', to: '/runs' },
          { label: id.slice(0, 8), to: '/runs/$id', params: { id } },
          { label: 'PR Checks' },
        ]}
        description="The two checks GitHub reports on every pull request: the TestSprite App suite and the SuiteVitals Ratchet baseline."
      />
      <RunTabs id={id} />

      <div className="space-y-4 p-6">
        <PrChecksPanel baseline={ratchetBaseline.tsi} />
      </div>
    </>
  )
}
