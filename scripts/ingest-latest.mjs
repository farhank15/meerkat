#!/usr/bin/env node
/**
 * ingest-latest.mjs — one-shot real-run ingest for Meerkat.
 *
 * Read-only TestSprite CLI calls (free) → compose a Run-shaped payload →
 * POST to the key-gated /api/runs endpoint. Run it after each TestSprite App
 * run (locally, or from CI) with:
 *
 *   TESTSPRITE_PROJECT_ID=... SUITEVITALS_API_KEY=... \
 *   node scripts/ingest-latest.mjs --sha <head-sha> --pr <pr#> --branch <branch>
 *
 * Sources of truth: live test statuses come from `test result --history
 * --source github_action`; scenario coverage comes from the SPEC.md contract by
 * ID-in-name matching (the same deterministic rule the dashboard engine uses).
 * Assertion-depth/vacuous analysis is NOT derived from runtime steps — it lives
 * in the portal plan (`planSteps[]`), so real ingested runs report
 * vacuousCount 0 honestly (documented limitation).
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const PID = process.env.TESTSPRITE_PROJECT_ID
if (!PID) {
  console.error('TESTSPRITE_PROJECT_ID is required')
  process.exit(2)
}

// ── args ────────────────────────────────────────────────────────────────────
const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 ? process.argv[i + 1] : fallback
}
const sha = arg('sha', process.env.GITHUB_SHA ?? null)
const pr = arg('pr', process.env.GITHUB_PR ?? null)
const branch = arg('branch', process.env.GITHUB_BRANCH ?? null)
const projectSlug = arg('project', 'meerkat-demo')
const base = arg(
  'api-url',
  process.env.MEERKAT_API_URL ?? 'https://meerkat-app.vercel.app',
)
const key = process.env.SUITEVITALS_API_KEY
if (!key) {
  console.error('SUITEVITALS_API_KEY is required (set it locally or as a secret)')
  process.exit(2)
}

const cli = (args) => JSON.parse(
  execFileSync('testsprite', [...args, '--output', 'json'], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    timeout: 300_000,
  }),
)

// ── 1. tests + latest real-run status per test ──────────────────────────────
const list = cli(['test', 'list', '--project', PID])
const tests = (list.items ?? []).map((t) => ({ id: t.id, name: t.name }))

const testCases = []
const refusedIds = []

const TERMINAL_STATUSES = new Set(['passed', 'failed', 'blocked', 'cancelled'])
const nonTerminalIds = []

for (const t of tests) {
  let status = 'unknown'
  let message = undefined
  try {
    const hist = cli(['test', 'result', t.id, '--history', '--source', 'github_action'])
    const runs = hist.runs ?? []
    if (runs.length > 0) {
      status = runs[0].status ?? 'unknown'
      if (status === 'failed') {
        try {
          const sum = cli(['test', 'failure', 'summary', t.id])
          message = sum.failureKind ? `${sum.failureKind}: ${sum.rootCauseHypothesis ?? ''}`.trim() : undefined
        } catch {
          // failure stats are best-effort; the verdict stands without them
        }
      }
      if (status === 'blocked' || status === 'cancelled') refusedIds.push(t.id)
      // Any non-terminal or unreadable status withholds a green verdict.
      if (!TERMINAL_STATUSES.has(status)) nonTerminalIds.push(t.id)
    } else {
      // No run history = no evidence in this wave.
      nonTerminalIds.push(t.id)
    }
  } catch (err) {
    status = 'unknown'
    message = `ingest read failed: ${err.message}`
    nonTerminalIds.push(t.id)
  }
  testCases.push({ name: t.name, specId: null, status, message })
}

// ── 2. SPEC.md contract + ID matching (same rule as the dashboard engine) ───
const specText = readFileSync(new URL('../SPEC.md', import.meta.url), 'utf8')
const SPEC_ID = /SV-[A-Z]{3}-\d{2}/
const specEntries = []
let lineNo = 0
const idLine = new Map()
for (const line of specText.split('\n')) {
  lineNo += 1
  const m = line.match(/SV-[A-Z]{3}-\d{2}/)
  if (!m) continue
  const id = m[0]
  if (!idLine.has(id)) idLine.set(id, lineNo)
  if (!specEntries.some((e) => e.id === id)) {
    specEntries.push({ id, specLine: lineNo, covered: false, asserts: line.slice(0, 160) })
  }
}

// Match SPEC IDs inside testcase names (case-sensitive, identical to engine).
for (const tc of testCases) {
  const m = tc.name.match(/SV-[A-Z]{3}-\d{2}/)
  if (m && idLine.has(m[0])) tc.specId = m[0]
}
const claims = new Map()
for (const tc of testCases) {
  if (tc.specId) claims.set(tc.specId, (claims.get(tc.specId) ?? 0) + 1)
}
for (const e of specEntries) e.covered = claims.has(e.id)

const covered = specEntries.filter((e) => e.covered).length
const conflictCount = [...claims.values()].filter((n) => n > 1).length

// ── 3. deterministic metric (// matcha: duplicates tsi.ts — keep in sync) ───
const totalIds = specEntries.length
const totalTests = testCases.length
const passed = testCases.filter((t) => t.status === 'passed').length
const failed = testCases.filter((t) => t.status === 'failed').length
const tested = totalTests // one run of every test → stability 1.0 (estimated)
const meaningfulPasses = passed // vacuous detection needs planSteps — 0 here
const coverage = totalIds === 0 ? 0 : covered / totalIds
const stability = tested < 2 ? 1.0 : 1 - conflictCount / tested
const passRate = totalTests === 0 ? 0 : meaningfulPasses / totalTests
const tsi = Math.round(
  100 * (totalIds === 0
    ? 0.6 * stability + 0.4 * passRate
    : 0.5 * coverage + 0.3 * stability + 0.2 * passRate) + 1e-9,
)

const verdictState = refusedIds.length > 0 || nonTerminalIds.length > 0
  ? 'incomplete'
  : failed > 0 ? 'failed' : 'green'
const verbatimNote = (refusedIds.length + nonTerminalIds.length) > 0
  ? `${refusedIds.length} refused-blocked / ${nonTerminalIds.length} non-terminal or unverified in this wave`
  : undefined

const isIncomplete = verdictState === 'incomplete'
const verdictLabel = verdictState === 'green'
  ? 'Verdict: green'
  : verdictState === 'failed'
    ? 'Verdict: failed run reported'
    : 'Verdict: incomplete run reported'

// ── 4. POST the payload ─────────────────────────────────────────────────────
const payload = {
  projectSlug,
  source: 'github_action',
  sha,
  pr,
  branch,
  status: isIncomplete ? 'incomplete' : 'complete',
  tsi: isIncomplete ? null : tsi,
  data: {
    metric: { tsi: isIncomplete ? 0 : tsi, coverage, stability, passRate },
    status: isIncomplete ? 'incomplete' : 'complete',
    total: totalTests,
    passed,
    failed,
    meaningfulPasses,
    vacuousCount: 0,
    conflicted: conflictCount,
    tested,
    coverageIdsTotal: totalIds,
    coverageIdsCovered: covered,
    specEntries,
    testCases,
    verdict: {
      state: verdictState,
      label: verdictLabel,
      detail: verbatimNote ?? `${passed}/${totalTests} passed · ${covered}/${totalIds} SPEC scenarios covered`,
      requested: totalTests,
      completed: passed + failed,
      refused: refusedIds.length,
    },
  },
}

const res = await fetch(`${base}/api/runs`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-suitevitals-key': key },
  body: JSON.stringify(payload),
})
const body = await res.json().catch(() => ({}))
console.log(`ingest → POST ${res.status}`, JSON.stringify(body))
if (!res.ok) process.exit(1)
