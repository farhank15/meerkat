#!/usr/bin/env node
/**
 * ingest-backfill.mjs — one-shot historical backfill for Meerkat.
 *
 * The TestSprite GitHub App already ran the real suite on every PR preview
 * (waves "github-pr-N"). Those results live only inside TestSprite; this
 * script copies them into the Meerkat ledger so /runs "Live · ingested from
 * CI" and the TSI trend reflect actual attest history. Read-only CLI calls
 * (free, no credits) → compose Run-shaped payloads → POST /api/runs.
 *
 *   node scripts/ingest-backfill.mjs                    # dry-run: print waves, NO write
 *   node scripts/ingest-backfill.mjs --apply            # POST all not-yet-ingested waves
 *   node scripts/ingest-backfill.mjs --apply --only 6   # only PR 6 waves
 *   node scripts/ingest-backfill.mjs --apply --force    # skip dedupe guards
 *
 * Wave→SHA mapping: for each PR we take its commits (gh pr view N) and pick
 * the latest commit whose push time precedes the wave start — each push
 * triggered its own App wave, so wave starts sit seconds after commit dates.
 * TSI/verdict semantics are identical to scripts/ingest-latest.mjs; the TSI
 * formula is imported from src/lib/tsi.ts (canon — no duplicated arithmetic).
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join as pathJoin } from 'node:path'
import { tsiFromCounts } from '../src/lib/tsi.ts'

// ── env & args ──────────────────────────────────────────────────────────────
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim()
}

const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 ? process.argv[i + 1] : fallback
}
const APPLY = process.argv.includes('--apply')
const FORCE = process.argv.includes('--force')
const PID = arg('project', process.env.TESTSPRITE_PROJECT_ID)
const key = process.env.SUITEVITALS_API_KEY
const base = arg('api-url', process.env.MEERKAT_API_URL ?? 'https://meerkat-app.vercel.app')
const only = arg('only') ? new Set(arg('only').split(',').map(Number)) : null

if (!PID) { console.error('TESTSPRITE_PROJECT_ID required (--project <id> or env)'); process.exit(2) }
if (APPLY && !key) { console.error('SUITEVITALS_API_KEY required for --apply'); process.exit(2) }

const LEDGER = pathJoin(tmpdir(), 'meerkat-backfill-ledger.json')
const cli = (args) => JSON.parse(
  execFileSync('testsprite', [...args, '--output', 'json'], {
    encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 300_000,
  }),
)
const ghPr = (pr) => {
  const raw = execFileSync('gh', ['pr', 'view', String(pr), '--json', 'commits,headRefName'], {
    encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 60_000,
  })
  const parsed = JSON.parse(raw)
  return {
    branch: parsed.headRefName,
    commits: parsed.commits
      .map((c) => ({ sha: c.oid, date: new Date(c.committedDate).getTime() }))
      .sort((a, b) => a.date - b.date),
  }
}

// ── 1. tests + full github_action history per test ─────────────────────────
const list = cli(['test', 'list', '--project', PID])
const tests = (list.items ?? []).map((t) => ({ id: t.id, name: t.name }))
console.log(`tests: ${tests.length}`)

/** entries: {testId, name, status, at, env, codeVersion, isRerun} */
const entries = []
for (const t of tests) {
  try {
    const hist = cli(['test', 'result', t.id, '--history', '--source', 'github_action', '--since', '30h']) // matcha: covers all Oct-19 waves with headroom
    for (const r of hist.runs ?? []) {
      entries.push({
        testId: t.id, name: t.name, status: r.status ?? 'unknown',
        at: new Date(r.createdAt).getTime(),
        env: r.environment?.name ?? null,
        codeVersion: r.codeVersion ?? null,
      })
    }
  } catch (err) {
    console.error(`history read failed for ${t.id}: ${err.message}`) // matcha: non-fatal, wave keeps other tests
  }
}
console.log(`github_action entries: ${entries.length}`)

// ── 2. wave grouping: env|sha (sha = latest push commit ≤ wave start) ──────
const prNumbers = [...new Set(entries.map((e) => e.env).filter(Boolean)
  .map((env) => env.match(/github-pr-(\d+)/)?.[1]).filter(Boolean))].map(Number)
const commitsByPr = new Map() // pr → {branch, commits[]}
const branchByPr = new Map()
for (const n of prNumbers) {
  try {
    const info = ghPr(n)
    commitsByPr.set(n, info.commits)
    branchByPr.set(n, info.branch)
  } catch (err) { console.error(`gh pr ${n}: ${err.message}`) }
} // PR 5 stays empty (closed, suite skipped) → no waves, correct.

const shaFor = (pr, at) => {
  const commits = commitsByPr.get(pr) ?? []
  let best = null
  for (const c of commits) if (c.date <= at) best = c
  return best?.sha ?? null
}

const waves = new Map() // key: pr|sha → {pr, sha, start, end, entries[]}
for (const e of entries) {
  const pr = Number(e.env?.match(/github-pr-(\d+)/)?.[1])
  if (!Number.isFinite(pr)) continue
  const sha = shaFor(pr, e.at)
  if (!sha) continue
  const k = `${pr}|${sha}`
  const w = waves.get(k) ?? { pr, sha, start: e.at, entries: [] }
  w.entries.push(e)
  w.start = Math.min(w.start, e.at)
  waves.set(k, w)
}
const waveList = [...waves.values()].sort((a, b) => a.start - b.start).map((w) => ({
  ...w,
  branch: branchByPr.get(w.pr) ?? `github-pr-${w.pr}`,
}))
const selected = only ? waveList.filter((w) => only.has(w.pr)) : waveList

// ── 3. SPEC.md contract + ID-in-name match (same rule as the engine) ───────
const specText = readFileSync(new URL('../SPEC.md', import.meta.url), 'utf8')
const specEntries = []
{
  let lineNo = 0
  const seen = new Set()
  for (const line of specText.split('\n')) {
    lineNo += 1
    const m = line.match(/SV-[A-Z]{3}-\d{2}/)
    if (!m || seen.has(m[0])) continue
    seen.add(m[0])
    specEntries.push({ id: m[0], specLine: lineNo, covered: false, asserts: line.slice(0, 160) })
  }
}
const totalIds = specEntries.length

// ── 4. compose payloads ─────────────────────────────────────────────────────
const TERMINAL = new Set(['passed', 'failed', 'blocked', 'cancelled'])
const payloads = []
for (const w of selected) {
  // Latest entry wins per test (a rerun supersedes the first attempt).
  const byTest = new Map()
  for (const e of w.entries) {
    const prev = byTest.get(e.testId)
    if (!prev || e.at > prev.at) byTest.set(e.testId, e)
  }
  const testCases = [...byTest.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => ({ name: e.name, specId: null, status: e.status, message: undefined }))

  const passed = testCases.filter((t) => t.status === 'passed').length
  const failed = testCases.filter((t) => t.status === 'failed').length
  const refused = testCases.filter((t) => t.status === 'blocked' || t.status === 'cancelled').length
  const nonTerminal = testCases.filter((t) => !TERMINAL.has(t.status)).length
  const total = testCases.length

  // ID-in-name matching: TestSprite flow names carry no SPEC ids yet → an
  // honest coverage of 0 and a readability-real TSI ≈ 50. That gap is the
  // exact reason Meerkat exists; the contract-bound baseline stays separate.
  const covered = 0
  const conflicted = 0
  const tsi = tsiFromCounts({
    coveredIds: covered, totalIds, conflicted,
    tested: total, meaningfulPasses: passed, totalTests: total,
  })

  const verdictState = refused + nonTerminal > 0 ? 'incomplete' : failed > 0 ? 'failed' : 'green'
  const isIncomplete = verdictState === 'incomplete'
  const detail = verdictState === 'green'
    ? `${passed}/${total} passed · 0/${totalIds} SPEC scenarios bound (flows not yet id-anchored)`
    : `${refused} refused-blocked / ${nonTerminal} non-terminal in this wave`

  payloads.push({
    projectSlug: 'meerkat-demo',
    source: 'github_action',
    sha: w.sha,
    pr: String(w.pr),
    branch: w.branch,
    status: isIncomplete ? 'incomplete' : 'complete',
    tsi: isIncomplete ? null : tsi,
    data: {
      metric: { tsi: isIncomplete ? 0 : tsi, coverage: covered / totalIds, stability: 1, passRate: total ? passed / total : 0 },
      status: isIncomplete ? 'incomplete' : 'complete',
      total, passed, failed, meaningfulPasses: passed, vacuousCount: 0,
      conflicted, tested: total, coverageIdsTotal: totalIds, coverageIdsCovered: covered,
      specEntries, testCases,
      verdict: {
        state: verdictState,
        label: verdictState === 'green' ? 'Verdict: green'
          : verdictState === 'failed' ? 'Verdict: failed run reported'
          : 'Verdict: incomplete run reported',
        detail,
        requested: total, completed: passed + failed, refused,
      },
      startedAt: new Date(w.start).toISOString(),
    },
  })
}

// ── 5. dedupe (POST always inserts → guard client-side) ────────────────────
const ingestedKeys = new Set()
if (!FORCE) {
  try {
    const res = await fetch(`${base}/api/runs`)
    const body = await res.json().catch(() => ({}))
    for (const r of body.runs ?? []) ingestedKeys.add(`${r.pr}|${r.sha ?? ''}`)
  } catch { /* unreachable API: dedupe degrades to ledger only */ }
  try {
    if (existsSync(LEDGER)) {
      for (const k of JSON.parse(readFileSync(LEDGER, 'utf8'))) ingestedKeys.add(k)
    }
  } catch { /* malformed ledger: ignore */ }
}

// ── 6. print table + POST ───────────────────────────────────────────────────
console.log('\nPR   SHA       wave-start (UTC)    tests  P  F  B   verdict      TSI   action')
for (const p of payloads) {
  const k = `${p.pr}|${p.sha}`
  const act = ingestedKeys.has(k) ? 'SKIP (ingested)' : APPLY ? 'POST' : 'dry-run'
  const d = p.data
  const ws = d.startedAt.slice(0, 19).replace('T', ' ')
  const blocked = d.total - d.passed - d.failed
  console.log(
    `${p.pr.padEnd(4)}${p.sha.slice(0, 7).padEnd(9)}${ws.padEnd(19)} ${String(d.total).padStart(5)}  ${String(d.passed).padStart(2)} ${String(d.failed).padStart(2)} ${String(blocked).padStart(2)}  ${d.verdict.state.padEnd(12)} ${(p.tsi ?? 'n/a').toString().padStart(4)}  ${act}`,
  )
}

if (!APPLY) {
  console.log(`\ndry-run only — rerun with --apply to POST ${payloads.length} wave(s)`)
  process.exit(0)
}

const fresh = payloads.filter((p) => !ingestedKeys.has(`${p.pr}|${p.sha}`))
const ledger = [...ingestedKeys]
for (const p of fresh) {
  const res = await fetch(`${base}/api/runs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-suitevitals-key': key },
    body: JSON.stringify(p),
  })
  const body = await res.json().catch(() => ({}))
  console.log(`POST pr ${p.pr} ${p.sha.slice(0, 7)} → ${res.status}`, JSON.stringify(body))
  if (res.ok) {
    ledger.push(`${p.pr}|${p.sha}`)
    writeFileSync(LEDGER, JSON.stringify([...new Set(ledger)]))
  }
}
console.log(`\ndone: ${fresh.length} posted, ${payloads.length - fresh.length} skipped`)
