// POST /api/runs — the ingest endpoint the CI workflow calls after a TestSprite
// run. Auth: `x-suitevitals-key` header must equal SUITEVITALS_API_KEY.
// GET /api/runs — latest persisted runs (read-only, public).

import { createFileRoute } from '@tanstack/react-router'
import { desc, eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { projects, runs } from '@/db/schema'
import { DEMO_PROJECT_SLUG, ensureDemoSeed } from '@/lib/auth.server'

interface IngestBody {
  projectSlug?: string
  source?: string
  sha?: string
  pr?: string
  branch?: string
  status?: string
  tsi?: number | null
  /** Run-shaped payload verbatim (what a dashboard render needs). */
  data?: unknown
}

export const Route = createFileRoute('/api/runs')({
  server: {
    handlers: {
      GET: async () => {
        const db = getDb()
        if (!db) return Response.json({ runs: [], note: 'database not configured' })
        const rows = await db
          .select({
            id: runs.id,
            slug: projects.slug,
            source: runs.source,
            status: runs.status,
            sha: runs.sha,
            tsi: runs.tsi,
            createdAt: runs.createdAt,
          })
          .from(runs)
          .innerJoin(projects, eq(runs.projectId, projects.id))
          .orderBy(desc(runs.createdAt))
          .limit(50)
        return Response.json({ runs: rows })
      },
      POST: async ({ request }) => {
        const expected = process.env.SUITEVITALS_API_KEY
        if (!expected) {
          return Response.json({ error: 'SUITEVITALS_API_KEY not configured' }, { status: 503 })
        }
        const presented = request.headers.get('x-suitevitals-key')
        if (presented !== expected) {
          return Response.json({ error: 'invalid ingest key' }, { status: 401 })
        }

        let body: IngestBody
        try {
          body = (await request.json()) as IngestBody
        } catch {
          return Response.json({ error: 'invalid body' }, { status: 400 })
        }
        if (!body.data) {
          return Response.json({ error: 'run `data` payload is required' }, { status: 400 })
        }

        const db = getDb()
        if (!db) {
          return Response.json({ error: 'database not configured' }, { status: 503 })
        }
        await ensureDemoSeed()
        const slug = body.projectSlug ?? DEMO_PROJECT_SLUG
        const [project] = await db
          .insert(projects)
          .values({ slug, name: slug, repoUrl: null })
          .onConflictDoUpdate({ target: projects.slug, set: { slug } })
          .returning()

        const [created] = await db
          .insert(runs)
          .values({
            projectId: project.id,
            source: body.source ?? 'cli',
            sha: body.sha ?? null,
            pr: body.pr ?? null,
            branch: body.branch ?? null,
            status: body.status ?? 'complete',
            tsi: body.tsi ?? null,
            data: body.data,
          })
          .returning({ id: runs.id })

        return Response.json({ ok: true, runId: created.id }, { status: 201 })
      },
    },
  },
})
