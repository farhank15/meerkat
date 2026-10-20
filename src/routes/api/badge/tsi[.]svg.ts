// GET /api/badge/tsi.svg?project=<slug> — public TSI badge.
//
// Reads the latest complete run of a PUBLIC project. There is no fixture
// fallback: when a project has no scored run the badge renders "n/a", because a
// number nobody earned is worse than an honest blank.

import { createFileRoute } from '@tanstack/react-router'
import { and, desc, eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { projects, runs } from '@/db/schema'
import { DEMO_PROJECT_SLUG } from '@/lib/auth.server'

function levelColor(tsi: number | null): { label: string; color: string } {
  if (tsi === null) return { label: 'n/a', color: '#6b7280' }
  if (tsi >= 80) return { label: 'strong', color: '#10b981' }
  if (tsi >= 50) return { label: 'moderate', color: '#f59e0b' }
  return { label: 'shallow', color: '#f43f5e' }
}

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** shields-style flat badge; deterministic widths so no random SVG. */
function badge(tsi: number | null): string {
  const label = 'test strength'
  const value = tsi === null ? 'n/a' : String(tsi)
  const lv = label.length * 6.5 + 14
  const vv = value.length * 9 + 16
  const width = Math.ceil(lv + vv)
  const { color } = levelColor(tsi)
  const midX = lv.toFixed(1)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${esc(label)}: ${value}">
  <title>${esc(label)}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${width}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${midX}" height="20" fill="#555"/>
    <rect x="${midX}" width="${vv}" height="20" fill="${color}"/>
    <rect width="${width}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110" transform="scale(.1)" letter-spacing="3">
    <text x="${(lv * 5).toFixed(0)}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" transform-origin="${(lv * 5).toFixed(0)} 0">${esc(label)}</text>
    <text x="${(lv * 5).toFixed(0)}" y="140" transform="scale(.1)" transform-origin="${(lv * 5).toFixed(0)} 0">${esc(label)}</text>
    <text x="${((lv + vv / 2) * 10).toFixed(0)}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)">${value}</text>
    <text x="${((lv + vv / 2) * 10).toFixed(0)}" y="140" transform="scale(.1)">${value}</text>
  </g>
</svg>`
}

export const Route = createFileRoute('/api/badge/tsi.svg')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const slug = url.searchParams.get('project') ?? DEMO_PROJECT_SLUG

        let tsi: number | null = null
        let source = 'no-data'

        try {
          const db = getDb()
          if (db) {
            const rows = await db
              .select({ tsi: runs.tsi })
              .from(runs)
              .innerJoin(projects, eq(runs.projectId, projects.id))
              .where(
                and(
                  eq(projects.slug, slug),
                  eq(projects.isPublic, true),
                  eq(projects.badgeEnabled, true),
                  eq(runs.status, 'complete'),
                ),
              )
              .orderBy(desc(runs.createdAt))
              .limit(1)

            const latest = rows[0]?.tsi
            if (typeof latest === 'number') {
              tsi = latest
              source = 'db'
            }
          }
        } catch {
          // matcha: a badge must never 500 — a DB hiccup renders n/a, not a stale score.
        }

        return new Response(badge(tsi), {
          status: 200,
          headers: {
            'content-type': 'image/svg+xml',
            'cache-control': 'public, max-age=120',
            'x-badge-source': source,
            'x-badge-project': slug,
          },
        })
      },
    },
  },
})
