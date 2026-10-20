// Seed the curated demo runs (run-demo-1, run-demo-2) into the DB for the
// meerkat-demo project, replacing any backfilled runs so the E2E demo suite
// sees a coherent, feature-complete narrative:
//   - run-demo-1: complete, TSI 93, verdict failed → loop fixed (green),
//     includes a vacuous pass (audited) and a shallow pass flagged "(1 assertion)".
//   - run-demo-2: complete, TSI 77, verdict failed → SV-FIX-06 escalation
//     (one red rerun, escalated to human instead of forced green).
//
// The live app (authed + public share) is 100% DB-driven; the in-code DEMO_RUN
// fixture is only used by unit tests. Backfilled runs imported real TestSprite
// results where SV-ADQ-03 actually failed, which the E2E demo tests reject — so
// we replace them with the curated demonstration.
//
// Idempotent: re-running patches the same two runs. Never runs in CI.
// matcha: demo-only data enrichment — destructive to backfilled meerkat-demo runs.

import { readFileSync } from 'node:fs'

const env = {}
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
process.env.DATABASE_URL = env.DATABASE_URL

const APPLY = process.argv.includes('--apply')
const { DEMO_RUN, DEMO_RUN_2 } = await import('../src/lib/store.ts')
const { tsiFromCounts } = await import('../src/lib/tsi.ts')
const { createPool } = await import('./db-client.mjs')

/** run-demo-1 is the documented primary fixture verbatim (TSI 93, 30/33
 * coverage, a vacuous pass audited, a shallow pass flagged). Kept identical to
 * the in-code DEMO_RUN so the live run matches the documented score and stays
 * internally consistent — SV-ADQ-03 appears as a gap row and the shallow pass
 * is flagged "(1 assertion)" on the run/audit views. */
function buildCuratedComplete() {
  return structuredClone(DEMO_RUN)
}

/** run-demo-2 is the SV-FIX-06 scenario: a finished, scored run that FAILED,
 * whose fix attempt came back red and was escalated to a human instead of being
 * force-greened. It is `complete` (so a real TSI is shown and the verdict is
 * reviewable) but its verdict is `failed` and it carries the escalation
 * evidence. The E2E suite inspects this run for the score breakdown, a
 * reviewable failed verdict, and the SV-FIX-06 escalation. */
function buildCuratedIncomplete() {
  const run = structuredClone(DEMO_RUN_2)
  run.status = 'complete'
  run.verdict = {
    state: 'failed',
    label: 'failed — fix attempt escalated',
    detail:
      'The regression was not fixed: the rerun came back red, so the loop ' +
      'escalated to a human instead of forcing a green. Review the failing ' +
      'evidence before any remediation is signed off.',
  }
  run.loop = {
    pr: '#13',
    classification: 'regression',
    action: 'escalate to human',
    result: 'escalated',
  }
  run.escalations = [
    {
      specId: 'SV-FIX-06',
      attempts: 1,
      maxAttempts: 1,
      rerun: 'red',
      result: 'escalated',
    },
  ]
  // Recompute a real, internally consistent TSI from the run's own counts so the
  // score breakdown is honest (coverage 2/3, stability 1, pass rate 2/3 → TSI 77).
  const coveredIds = run.coverageIdsCovered
  const totalIds = run.coverageIdsTotal
  const tested = run.total
  const meaningfulPasses = run.meaningfulPasses
  const tsi = tsiFromCounts({
    coveredIds,
    totalIds,
    conflicted: run.conflicted,
    tested,
    meaningfulPasses,
    totalTests: tested,
  })
  run.metric = {
    tsi,
    coverage: coveredIds / totalIds,
    stability: tested > 0 ? 1 - run.conflicted / tested : 0,
    passRate: tested > 0 ? meaningfulPasses / tested : 0,
  }
  return run
}

function summarize(run, label) {
  const specs = run.specEntries ?? []
  const tcs = run.testCases ?? []
  console.log(
    `${label}: id=${run.id} status=${run.status} tsi=${run.metric?.tsi} ` +
      `coverage=${run.coverageIdsCovered}/${run.specEntries?.length} ` +
      `total=${run.total} passed=${run.passed} shallow=${tcs.filter((t) => t.shallow).length} ` +
      `vacuous=${tcs.filter((t) => t.vacuous).length}`,
  )
  const adq = specs.find((s) => s.id === 'SV-ADQ-03')
  console.log(`  SV-ADQ-03 specEntry:`, JSON.stringify(adq))
}

const complete = buildCuratedComplete()
const incomplete = buildCuratedIncomplete()
summarize(complete, 'run-demo-1 (complete)')
summarize(incomplete, 'run-demo-2 (incomplete)')

if (!APPLY) {
  console.log('\ndry-run only — rerun with --apply to write the curated demo runs.')
  process.exit(0)
}

const pool = createPool()
try {
  const { rows: projectRows } = await pool.query(
    `select id from projects where slug = 'meerkat-demo' limit 1`,
  )
  const projectId = projectRows[0]?.id
  if (!projectId) {
    console.error('meerkat-demo project not found')
    process.exit(1)
  }

  // Replace any backfilled runs for this project with the two curated runs.
  await pool.query(`delete from runs where project_id = $1`, [projectId])

  const now = Date.now()
  const rows = [
    { run: complete, createdAt: new Date(now) },
    { run: incomplete, createdAt: new Date(now - 60_000) },
  ]
  for (const { run, createdAt } of rows) {
    const tsi = run.status === 'incomplete' ? null : run.metric?.tsi ?? null
    await pool.query(
      `insert into runs (project_id, source, sha, pr, branch, status, tsi, data, started_at)
       values ($1, 'cli', $2, $3, $4, $5, $6, $7::jsonb, $8)`,
      [
        projectId,
        run.sha ?? null,
        run.pr ?? null,
        run.branch ?? null,
        run.status,
        tsi,
        JSON.stringify(run),
        createdAt,
      ],
    )
    console.log(`inserted ${run.id} (${run.status}) tsi=${tsi}`)
  }
  console.log('\ncurated demo runs seeded.')
} finally {
  await pool.end()
}
