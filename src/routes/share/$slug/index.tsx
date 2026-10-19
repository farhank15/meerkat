// Public, unauthenticated scorecard for a shared project. Slug validity is
// enforced by the parent route's beforeLoad.

import { createFileRoute, Link } from '@tanstack/react-router'
import { DEMO_RUN, getProjectBySlug } from '@/lib/store'
import { Container, ScoreCard } from '@/components/site'
import { ShareNotFound } from '@/components/ShareNotFound'
import { slugifyTestName } from '@/components/CoverageTrace'
import { BorderBeam } from '@/components/magicui'

export const Route = createFileRoute('/share/$slug/')({
  component: SharePage,
})

function SharePage() {
  const { slug } = Route.useParams()
  const project = getProjectBySlug(slug)
  if (!project) return <ShareNotFound />

  const { tsi, coverage, stability, passRate } = DEMO_RUN.metric

  return (
    <Container className="py-12">
      {/* Hero header — the public, read-only face of the scorecard. */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-neutral-950/40 px-6 py-10 sm:px-10">
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-300">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Public share · {project.name}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-50 sm:text-4xl">
              Test Strength Index
            </h1>
            <p className="mt-2 max-w-md text-sm text-neutral-400">
              A read-only view of the latest run. No login required to inspect the
              score, the coverage trace, and the commit it was pinned to.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-white/20 hover:text-neutral-100"
            >
              Repository ↗
            </a>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-400">
              shared link · {slug}
            </span>
          </div>
        </div>
      </div>

      {/* Score + coverage, side by side on wide screens. */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[22rem_1fr]">
        <div className="relative overflow-hidden rounded-2xl">
          <BorderBeam />
          <ScoreCard
            tsi={tsi}
            coverage={coverage}
            stability={stability}
            passRate={passRate}
          />
        </div>

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
                  <tr
                    key={s.id}
                    className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-2.5 font-mono text-xs text-neutral-300">
                      {s.id}
                    </td>
                    <td className="px-5 py-2.5">
                      {s.covered ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400">
                          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          covered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-400">
                          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          gap
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-neutral-500">
                      {s.testName ? (
                        <a
                          href={`/share/${slug}/run/${DEMO_RUN.id}#testcase-${slugifyTestName(s.testName)}`}
                          className="text-emerald-400 underline-offset-2 transition-colors hover:text-emerald-300 hover:underline"
                        >
                          {s.testName}
                        </a>
                      ) : (
                        <span className="text-neutral-600">no test</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-neutral-900/40 px-5 py-4">
            <p className="text-sm text-neutral-500">
              Want the full audit trail and commit traceability?{' '}
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300">
                Sign in with the demo account
              </Link>{' '}
              to open the run detail.
            </p>
            <span className="text-[11px] uppercase tracking-wider text-neutral-600">
              read-only · public view
            </span>
          </div>
        </div>
      </div>
    </Container>
  )
}
