// POST /api/runs — ingest endpoint used by CI.
//   Authorization: Bearer mk_live_...   (preferred, workspace-scoped)
//   x-suitevitals-key: <env key>        (legacy bootstrap, existing projects only)
//
// GET /api/runs — read endpoint.
//   ?project=<slug>  scopes to one project (must be public, or a valid key)
//   ?sha=<sha>       filters to one commit
// Without `project`, only public projects are returned — a private workspace is
// never readable through this endpoint.

import { createFileRoute } from '@tanstack/react-router'
import { and, desc, eq, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { apiKeys, projects, runs } from '@/db/schema'
import { DEMO_PROJECT_SLUG } from '@/lib/auth.server'
import { parseApiKey, verifySecret } from '@/lib/api-keys.server'

interface IngestBody {
  projectSlug?: string
  source?: string
  sha?: string
  pr?: string
  branch?: string
  status?: string
  tsi?: number | null
  startedAt?: string | null
  dedupeKey?: string | null
  /** Run-shaped payload verbatim (what a dashboard render needs). */
  data?: unknown
}

interface ResolvedKey {
  workspaceId: string
  projectId: string | null
  scopes: string[]
}

function presentedKey(request: Request): string | null {
  const bearer = request.headers.get('authorization')
  if (bearer?.toLowerCase().startsWith('bearer ')) return bearer.slice(7).trim()
  return request.headers.get('x-api-key') ?? request.headers.get('x-suitevitals-key')
}

async function resolveApiKey(request: Request): Promise<ResolvedKey | null> {
  const raw = presentedKey(request)
  if (!raw) return null

  const parsed = parseApiKey(raw)
  if (!parsed) return null

  const db = getDb()
  if (!db) return null

  const [row] = await db
    .select({
      id: apiKeys.id,
      workspaceId: apiKeys.workspaceId,
      projectId: apiKeys.projectId,
      keyHash: apiKeys.keyHash,
      scopes: apiKeys.scopes,
      expiresAt: apiKeys.expiresAt,
      revokedAt: apiKeys.revokedAt,
      lastUsedAt: apiKeys.lastUsedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.prefix, parsed.prefix))
    .limit(1)

  if (!row || !row.workspaceId) return null
  if (row.revokedAt) return null
  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) return null
  if (!verifySecret(parsed.secret, row.keyHash)) return null

  // Throttle the write: one update per minute is enough for an audit trail.
  if (!row.lastUsedAt || Date.now() - row.lastUsedAt.getTime() > 60_000) {
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, row.id))
  }

  return { workspaceId: row.workspaceId, projectId: row.projectId, scopes: row.scopes }
}

export const Route = createFileRoute('/api/runs')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const db = getDb()
        if (!db) return Response.json({ runs: [], note: 'database not configured' })

        const url = new URL(request.url)
        const projectSlug = url.searchParams.get('project')
        const sha = url.searchParams.get('sha')
        const limit = Math.min(Number(url.searchParams.get('limit') ?? 50) || 50, 100)

        try {
          const filters = []

          if (projectSlug) {
            const key = await resolveApiKey(request)
            const [project] = await db
              .select({ id: projects.id, workspaceId: projects.workspaceId, isPublic: projects.isPublic })
              .from(projects)
              .where(eq(projects.slug, projectSlug))
              .limit(1)

            if (!project) return Response.json({ error: 'project_not_found' }, { status: 404 })

            const readable = project.isPublic || (key !== null && key.workspaceId === project.workspaceId)
            if (!readable) return Response.json({ error: 'project_not_found' }, { status: 404 })

            filters.push(eq(runs.projectId, project.id))
          } else {
            filters.push(eq(projects.isPublic, true))
          }

          if (sha) filters.push(eq(runs.sha, sha))

          const rows = await db
            .select({
              id: runs.id,
              slug: projects.slug,
              project: projects.name,
              source: runs.source,
              status: runs.status,
              sha: runs.sha,
              pr: runs.pr,
              branch: runs.branch,
              tsi: runs.tsi,
              createdAt: runs.createdAt,
              startedAt: sql<string | null>`coalesce(${runs.startedAt}, ${runs.createdAt})`,
            })
            .from(runs)
            .innerJoin(projects, eq(runs.projectId, projects.id))
            .where(and(...filters))
            .orderBy(desc(runs.createdAt))
            .limit(limit)

          return Response.json({ runs: rows })
        } catch (error) {
          console.error('[runs] GET failed:', (error as Error).message)
          return Response.json({ runs: [], note: 'database unavailable' }, { status: 503 })
        }
      },

      POST: async ({ request }) => {
        const db = getDb()
        if (!db) return Response.json({ error: 'database not configured' }, { status: 503 })

        let body: IngestBody
        try {
          body = (await request.json()) as IngestBody
        } catch {
          return Response.json({ error: 'invalid body' }, { status: 400 })
        }
        if (!body.data) {
          return Response.json({ error: 'run `data` payload is required' }, { status: 400 })
        }

        const key = await resolveApiKey(request)
        const legacyKey = process.env.SUITEVITALS_API_KEY
        const legacyEnabled = process.env.LEGACY_INGEST_KEY_ENABLED !== 'false'
        const isLegacy = !key && legacyEnabled && Boolean(legacyKey) && presentedKey(request) === legacyKey

        if (!key && !isLegacy) {
          return Response.json({ error: 'invalid ingest key' }, { status: 401 })
        }
        if (key && !key.scopes.includes('ingest')) {
          return Response.json({ error: 'key lacks the ingest scope' }, { status: 403 })
        }

        const slug = body.projectSlug ?? DEMO_PROJECT_SLUG
        const [existing] = await db
          .select({ id: projects.id, workspaceId: projects.workspaceId })
          .from(projects)
          .where(eq(projects.slug, slug))
          .limit(1)

        let projectId: string
        if (existing) {
          if (key && existing.workspaceId !== key.workspaceId) {
            return Response.json({ error: 'project_not_in_workspace' }, { status: 403 })
          }
          if (key?.projectId && key.projectId !== existing.id) {
            return Response.json({ error: 'key_is_scoped_to_another_project' }, { status: 403 })
          }
          projectId = existing.id
        } else {
          // A generated key may create a project inside its own workspace. The
          // legacy env key may not: it is not tied to a tenant.
          if (!key) return Response.json({ error: 'project_not_found' }, { status: 404 })
          const [created] = await db
            .insert(projects)
            .values({ slug, name: slug, workspaceId: key.workspaceId })
            .returning({ id: projects.id })
          projectId = created.id
        }

        const parsedStart = body.startedAt ? new Date(body.startedAt) : null
        const startedAt = parsedStart && !Number.isNaN(parsedStart.getTime()) ? parsedStart : null
        const dedupeKey =
          body.dedupeKey ??
          (body.sha ? `${body.sha}:${startedAt?.toISOString() ?? 'latest'}` : null)

        const values = {
          projectId,
          source: body.source ?? 'cli',
          sha: body.sha ?? null,
          pr: body.pr ?? null,
          branch: body.branch ?? null,
          status: body.status ?? 'complete',
          tsi: typeof body.tsi === 'number' ? Math.round(body.tsi) : null,
          data: body.data,
          startedAt,
          dedupeKey,
        }

        if (dedupeKey) {
          const [inserted] = await db
            .insert(runs)
            .values(values)
            .onConflictDoNothing({
              target: [runs.projectId, runs.dedupeKey],
              where: sql`${runs.dedupeKey} is not null`,
            })
            .returning({ id: runs.id })

          if (inserted) return Response.json({ ok: true, runId: inserted.id, deduped: false }, { status: 201 })

          const [existingRun] = await db
            .select({ id: runs.id })
            .from(runs)
            .where(and(eq(runs.projectId, projectId), eq(runs.dedupeKey, dedupeKey)))
            .limit(1)

          return Response.json({ ok: true, runId: existingRun?.id ?? null, deduped: true }, { status: 200 })
        }

        const [created] = await db.insert(runs).values(values).returning({ id: runs.id })
        return Response.json({ ok: true, runId: created.id, deduped: false }, { status: 201 })
      },
    },
  },
})
