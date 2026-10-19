// GET /api/agent-brief?project=<slug> — public, agent-readable verdict brief.
//
// DB only. There is no fixture fallback: when a project has no run, the brief
// says `no-runs` instead of describing evidence that does not exist.

import { createFileRoute } from '@tanstack/react-router'
import { and, desc, eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { projects, runs } from '@/db/schema'
import { DEMO_PROJECT_SLUG } from '@/lib/auth.server'
import { auditRun } from '@/lib/auditor'
import type { Run } from '@/lib/store'

interface BriefPayload {
  source: 'live' | 'no-runs'
  project: { slug: string; name: string; repo: string | null }
  runId: string | null
  sha: string | null
  status: string | null
  tsi: number | null
  coverage: { covered: number | null; total: number | null }
  verdictState: string | null
  verdictLabel: string | null
  coverageGaps: Array<{ id: string; specLine: number }>
  assertionQuality: unknown
  links: Record<string, string>
  usage: string
}

export const Route = createFileRoute('/api/agent-brief')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const slug = url.searchParams.get('project') ?? DEMO_PROJECT_SLUG
        const origin = url.origin

        const links = {
          brief: `${origin}/api/agent-brief?project=${encodeURIComponent(slug)}`,
          badge: `${origin}/api/badge/tsi.svg?project=${encodeURIComponent(slug)}`,
          scorecard: `${origin}/share/${slug}`,
        }

        const empty: BriefPayload = {
          source: 'no-runs',
          project: { slug, name: slug, repo: null },
          runId: null,
          sha: null,
          status: null,
          tsi: null,
          coverage: { covered: null, total: null },
          verdictState: null,
          verdictLabel: null,
          coverageGaps: [],
          assertionQuality: { note: 'no scored run for this project' },
          links,
          usage:
            'No run has been ingested for this project. Do not treat missing evidence as a passing suite.',
        }

        const db = getDb()
        if (!db) return Response.json(empty, { headers: { 'cache-control': 'no-store' } })

        const [project] = await db
          .select({
            id: projects.id,
            name: projects.name,
            slug: projects.slug,
            repoUrl: projects.repoUrl,
            isPublic: projects.isPublic,
          })
          .from(projects)
          .where(eq(projects.slug, slug))
          .limit(1)

        if (!project || !project.isPublic) {
          return Response.json({ error: 'project_not_found' }, { status: 404 })
        }

        const [row] = await db
          .select({ id: runs.id, sha: runs.sha, status: runs.status, tsi: runs.tsi, data: runs.data })
          .from(runs)
          .where(and(eq(runs.projectId, project.id), eq(runs.status, 'complete')))
          .orderBy(desc(runs.createdAt))
          .limit(1)

        if (!row) {
          return Response.json(
            { ...empty, project: { slug: project.slug, name: project.name, repo: project.repoUrl } },
            { headers: { 'cache-control': 'public, max-age=60' } },
          )
        }

        const data = (row.data ?? {}) as Run
        const gaps = (data.specEntries ?? [])
          .filter((entry) => !entry.covered)
          .map((entry) => ({ id: entry.id, specLine: entry.specLine }))

        const audit = auditRun(data)

        const payload: BriefPayload = {
          source: 'live',
          project: { slug: project.slug, name: project.name, repo: project.repoUrl },
          runId: row.id,
          sha: row.sha,
          status: row.status,
          tsi: typeof row.tsi === 'number' ? row.tsi : null,
          coverage: {
            covered: typeof data.coverageIdsCovered === 'number' ? data.coverageIdsCovered : null,
            total: typeof data.coverageIdsTotal === 'number' ? data.coverageIdsTotal : null,
          },
          verdictState: data.verdict?.state ?? null,
          verdictLabel: data.verdict?.label ?? null,
          coverageGaps: gaps,
          assertionQuality: {
            state: audit.state,
            headline: audit.headline,
            vacuous: audit.counts.vacuous,
            orphans: audit.counts.orphans,
            conflicts: audit.counts.conflicted,
            gaps: audit.counts.gaps,
          },
          links,
          usage:
            'Read the verdict and the gaps before changing code or writing tests. Do not re-run tests to inflate scores; treat refused/incomplete runs as evidence-not-ready.',
        }

        return Response.json(payload, { headers: { 'cache-control': 'public, max-age=60' } })
      },
    },
  },
})
