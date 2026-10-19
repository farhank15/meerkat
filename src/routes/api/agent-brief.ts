// GET /api/agent-brief — public, agent-readable verdict brief.
 //
// The developer/agent-facing side of Meerkat: any IDE agent, CI job, or MCP
// client can fetch this JSON to learn the latest run's verdict, coverage gaps,
// and assertion-quality findings — before acting (e.g. before fixing code or
// writing more tests). DB-first: the latest complete ingested run wins; the
// committed baseline evidence is the deterministic fallback.

import { createFileRoute } from '@tanstack/react-router'
import { and, desc, eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { projects, runs } from '@/db/schema'
import { DEMO_PROJECT_SLUG } from '@/lib/auth.server'
import { DEMO_RUN, DEMO_PROJECT } from '@/lib/store'
import { auditRun } from '@/lib/auditor'

interface StoredRun {
  id: string
  sha: string | null
  data: unknown
}

// The stored `data` payload is Run-shaped; brief only needs a few surfaces.
// Unknown/legacy shapes degrade to `null` fields never to thrown responses.
function selectFields(run: StoredRun | undefined) {
  if (!run) return undefined
  const d = (run.data ?? {}) as Record<string, unknown>
  const metric = (d.metric ?? {}) as Record<string, number>
  const verdict = (d.verdict ?? {}) as Record<string, unknown>
  const tsi = typeof metric.tsi === 'number' ? metric.tsi : null
  return {
    runId: run.id,
    sha: run.sha ?? (typeof d.sha === 'string' ? (d.sha as string) : null),
    status: typeof d.status === 'string' ? (d.status as string) : 'unknown',
    tsi,
    coverage: {
      covered: typeof d.coverageIdsCovered === 'number' ? d.coverageIdsCovered : null,
      total: typeof d.coverageIdsTotal === 'number' ? d.coverageIdsTotal : null,
    },
    verdictState: typeof verdict.state === 'string' ? (verdict.state as string) : null,
    verdictLabel: typeof verdict.label === 'string' ? (verdict.label as string) : null,
  }
}

function gapRows(run: StoredRun | undefined): Array<{ id: string; specLine: number }> {
  if (!run) return []
  const d = (run.data ?? {}) as { specEntries?: Array<{ id: string; specLine: number; covered: boolean }> }
  return (d.specEntries ?? []).filter((e) => !e.covered).map((e) => ({ id: e.id, specLine: e.specLine }))
}

export const Route = createFileRoute('/api/agent-brief')({
  server: {
    handlers: {
      GET: async () => {
        const origin = (() => {
          try {
            return new URL(process.env.MEERKAT_API_URL ?? 'https://meerkat-app.vercel.app').origin
          } catch {
            return 'https://meerkat-app.vercel.app'
          }
        })()
        const db = getDb()
        let stored: StoredRun | undefined
        if (db) {
          try {
            stored = (await db
              .select({ id: runs.id, sha: runs.sha, data: runs.data })
              .from(runs)
              .innerJoin(projects, eq(runs.projectId, projects.id))
              .where(and(eq(projects.slug, DEMO_PROJECT_SLUG), eq(runs.status, 'complete')))
              .orderBy(desc(runs.createdAt))
              .limit(1))[0]
          } catch {
            // DB hiccup → baseline fallback below (badge-grade honesty contract)
          }
        }

        const live = selectFields(stored)
        const baseline = {
          runId: DEMO_RUN.id,
          sha: DEMO_RUN.sha,
          status: DEMO_RUN.status,
          tsi: DEMO_RUN.metric.tsi,
          coverage: {
            covered: DEMO_RUN.coverageIdsCovered,
            total: DEMO_RUN.coverageIdsTotal,
          },
          verdictState: DEMO_RUN.verdict?.state ?? 'green',
          verdictLabel: DEMO_RUN.verdict?.label ?? null,
        }

        const source = live ? 'live-ingested-run' : 'baseline-evidence'
        const chosen = live ?? baseline
        const coverageGaps = source === 'baseline-evidence'
          ? (DEMO_RUN.specEntries ?? []).filter((e) => !e.covered).map((e) => ({ id: e.id, specLine: e.specLine }))
          : gapRows(stored)
        // The audit engine is deterministic; computed only where the full Run
        // shape exists (baseline fixture) — real ingested runs report the
        // honesty note instead.
        const assertionQuality = source === 'baseline-evidence'
          ? (() => {
              const a = auditRun(DEMO_RUN)
              return {
                state: a.state,
                headline: a.headline,
                vacuous: a.counts.vacuous,
                orphans: a.counts.orphans,
                conflicts: a.counts.conflicted,
              }
            })()
          : { note: 'assertion-depth lives in the portal plan; real ingested runs report vacuousCount 0 honestly' }

        return Response.json(
          {
            project: { slug: DEMO_PROJECT.slug, name: DEMO_PROJECT.name, repo: DEMO_PROJECT.repoUrl },
            source,
            ...chosen,
            metric:
              source === 'baseline-evidence'
                ? DEMO_RUN.metric
                : { tsi: chosen.tsi, coverage: chosen.coverage },
            coverageGaps,
            assertionQuality,
            links: {
              brief: `${origin}/api/agent-brief`,
              badge: `${origin}/api/badge/tsi.svg`,
              scorecard: `${origin}/s/meerkat-demo`,
              specContract: 'https://github.com/farhank15/meerkat/blob/main/SPEC.md',
            },
            usage: 'Read the verdict and the gaps before changing code or writing tests. Do not re-run tests to inflate scores; treat refused/incomplete runs as evidence-not-ready.',
          },
          { headers: { 'cache-control': 'public, max-age=60' } },
        )
      },
    },
  },
})
