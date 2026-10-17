// Public, unauthenticated scorecard for a shared project. Slug validity is
// enforced by the parent route's beforeLoad.

import { createFileRoute, Link } from '@tanstack/react-router'
import { DEMO_RUN, getProjectBySlug } from '@/lib/store'
import { Container, ScoreCard } from '@/components/site'
import { ShareNotFound } from '@/routes/share/$slug'

export const Route = createFileRoute('/share/$slug/')({
  component: SharePage,
})

function SharePage() {
  const { slug } = Route.useParams()
  const project = getProjectBySlug(slug)
  if (!project) return <ShareNotFound />

  const { tsi, coverage, stability, passRate } = DEMO_RUN.metric

  return (
    <Container className="py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-400">
            Public share · {project.name}
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-50">
            Test Strength Index
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-emerald-400 underline-offset-2 transition-colors hover:text-emerald-300 hover:underline"
          >
            Repository ↗
          </a>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-neutral-400">
            shared link · {slug}
          </span>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[22rem_1fr]">
        <ScoreCard
          tsi={tsi}
          coverage={coverage}
          stability={stability}
          passRate={passRate}
        />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Coverage traceability ({DEMO_RUN.coverageIdsCovered}/
              {DEMO_RUN.coverageIdsTotal})
            </h2>
            <Link
              to="/share/$slug/run/$id"
              params={{ slug, id: DEMO_RUN.id }}
              className="text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
            >
              Open run {DEMO_RUN.id} →
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-neutral-500">
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Test</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_RUN.specEntries.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-2.5 font-mono text-xs text-neutral-300">
                      {s.id}
                    </td>
                    <td className="px-5 py-2.5">
                      {s.covered ? (
                        <span className="text-emerald-400">covered</span>
                      ) : (
                        <span className="text-amber-400">gap</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-neutral-500">{s.testName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-sm text-neutral-500">
            Want the full audit trail and commit traceability?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300">
              Sign in with the demo account
            </Link>{' '}
            to open the run detail.
          </p>
        </div>
      </div>
    </Container>
  )
}
