#!/usr/bin/env node
/**
 * ratchet.mjs — SuiteVitals Ratchet + verdict-trust gate, run read-only.
 *
 * Subcommands (no suite credits spent — TestSprite CLI reads are free):
 *
 *   snapshot   Print a JSON snapshot of the latest per-test statuses across the
 *              project (digest for settle-polling + the failing test names).
 *
 *   gate       Read the Meerkat ledger, find the ingest row for this commit's
 *              SHA and enforce the ratchet: a complete run scoring below the
 *              committed baseline fails the job and writes agent-bundle.json
 *              (the dispatch input for the remediation job). An incomplete run
 *              (blocked/cancelled tests → verdict withheld) and a missing row
 *              both PASS explicitly — F18 verdict-trust: the loop stays silent
 *              unless it is holding a trustworthy verdict. Never lies with a
 *              dash made into a zero.
 *
 * Baseline policy: the highest complete real-run TSI recorded on main
 * (baseline/tsi.json). A drop of any amount blocks the PR until fixed.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const PID = process.env.TESTSPRITE_PROJECT_ID
if (!PID) {
  console.error('TESTSPRITE_PROJECT_ID is required')
  process.exit(2)
}

const appUrl = process.env.MEERKAT_API_URL ?? 'https://meerkat-app.vercel.app'

const cli = (args) => JSON.parse(
  execFileSync('testsprite', [...args, '--output', 'json'], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    timeout: 300_000,
  }),
)

function snapshot() {
  const list = cli(['test', 'list', '--project', PID])
  const items = (list.items ?? []).map((t) => ({ id: t.id, name: t.name, status: t.status }))
  const counts = { passed: 0, failed: 0, blocked: 0, other: 0 }
  for (const t of items) {
    if (t.status === 'passed') counts.passed += 1
    else if (t.status === 'failed') counts.failed += 1
    else if (t.status === 'blocked') counts.blocked += 1
    else counts.other += 1
  }
  const failed = items.filter((t) => t.status === 'failed').map((t) => t.name)
  const digest = JSON.stringify(items.map((t) => [t.id, t.status]).sort())
  return { digest, counts, failed, totals: items.length }
}

// ── subcommand: snapshot ──────────────────────────────────────────────────
const sub = process.argv[2]
if (sub === 'snapshot') {
  process.stdout.write(JSON.stringify(snapshot()))
  process.exit(0)
}

if (sub !== 'gate') {
  console.error('usage: node scripts/ratchet.mjs snapshot | gate [--baseline-file baseline/tsi.json]')
  process.exit(2)
}

const sha = process.env.GITHUB_SHA ?? null
if (!sha) {
  console.error('GITHUB_SHA (head commit sha) is required for `gate`')
  process.exit(2)
}

// ── subcommand: gate ─────────────────────────────────────────────────────
if (sub === 'gate') {
  const arg = (name, fallback = null) => {
    const i = process.argv.indexOf(`--${name}`)
    return i !== -1 ? process.argv[i + 1] : fallback
  }
  const minStarted = arg('min-started')  // ISO instant: the wave must start after this
  const baselinePath = arg('baseline-file', 'baseline/tsi.json')
  const baselineData = JSON.parse(readFileSync(baselinePath, 'utf8'))
  const baseline = Number(baselineData.tsi)
  if (!Number.isFinite(baseline)) {
    console.error(`baseline/tsi.json has no numeric \`tsi\``)
    process.exit(2)
  }

  // Fresh read of what actually failed on the latest App run for this commit.
  const snap = snapshot()

  // The ingest job has already POSTed once. Find this commit's row.
  const res = await fetch(`${appUrl}/api/runs`)
  const body = await res.json()
  const rows = body.runs ?? []
  const row = rows.find((r) =>
    r.sha && sha.startsWith(r.sha)
    && rowStartedAfter(minStarted, r.startedAt),
  )

  /** `startedAt >= minStarted` — never score a wave that did not begin after
   * the fix commit, and never fabricate a green by replaying older statuses. */
  function rowStartedAfter(min, startedAt) {
    if (!min) return true
    if (!startedAt) return false
    return String(startedAt) >= min
  }

  const bundle = (reason, extra = {}) => {
    const s = {
      generatedAt: new Date().toISOString(),
      commit: sha,
      reason,
      failedTests: snap.failed,
      counts: snap.counts,
      baseline,
      runRow: row ?? null,
      agentBriefUrl: `${appUrl}/api/agent-brief`,
      ...extra,
    }
    writeFileSync('agent-bundle.json', JSON.stringify(s, null, 2))
    return s
  }

  if (!row) {
    bundle('no-row — ledger has no ingest for this commit yet; the loop stays silent (verdict-trust)')
    console.log(`gate: PASS — no ledger row for ${sha.slice(0, 7)} (loop silent, do not punish unverifiable)`)
    process.exit(0)
  }
  if (row.status !== 'complete') {
    bundle(`verdict-withheld — run status "${row.status}" is not scoreable; the loop stays silent`)
    console.log(`gate: PASS — verdict withheld (— is not a zero); no dispatch`)
    process.exit(0)
  }
  if (row.tsi === null || row.tsi === undefined) {
    bundle('no-tsi — complete run without a score; treat as unverifiable, loop stays silent')
    console.log(`gate: PASS — complete run carries no TSI; no dispatch`)
    process.exit(0)
  }

  if (row.tsi < baseline) {
    const s = bundle(`score-drop — TSI ${row.tsi} below committed baseline ${baseline}; dispatching remediation`)
    console.error(`gate: FAIL — ratchet dropped: TSI ${row.tsi} < baseline ${baseline} (${snap.failed.length} failing tests; bundle written)`)
    process.exit(1)
  }

  bundle('score-held — nothing to do')
  console.log(`gate: PASS — TSI ${row.tsi} ≥ baseline ${baseline}`)
  process.exit(0)
}

