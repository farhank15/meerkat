// One-off: enrich the latest `meerkat-demo` run so the public scorecard
// demonstrates the restored escalation loop and shallow-pass flag.
//
// Idempotent: re-running patches the same latest run. To revert, run with
// UNDO=1 (restores the snapshot captured on first run).
//
// matcha: demo-only data enrichment — never runs in CI, never touches fixtures.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

function loadEnv() {
  const raw = readFileSync(resolve(root, '.env.local'), 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) {
      env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return env
}

const env = loadEnv()
const DATABASE_URL = env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in .env.local')
  process.exit(1)
}

const { neon } = await import('@neondatabase/serverless')
const sql = neon(DATABASE_URL)

const SNAPSHOT_PATH = resolve(root, 'scripts/.demo-loop-snapshot.json')

async function main() {
  const undo = process.env.UNDO === '1'

  const [project] = await sql`select id from projects where slug = 'meerkat-demo' limit 1`
  if (!project) {
    console.error('meerkat-demo project not found')
    process.exit(1)
  }

  const rows = await sql`
    select id, data from runs
    where project_id = ${project.id}
    order by created_at desc
    limit 1
  `
  const latest = rows[0]
  if (!latest) {
    console.error('no runs for meerkat-demo')
    process.exit(1)
  }

  if (undo) {
    const { readFileSync } = await import('node:fs')
    const snap = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'))
    await sql`update runs set data = ${JSON.stringify(snap.data)}::jsonb where id = ${latest.id}`
    console.log(`reverted run ${latest.id}`)
    return
  }

  const { writeFileSync } = await import('node:fs')
  writeFileSync(SNAPSHOT_PATH, JSON.stringify({ id: latest.id, data: latest.data }))

  const data = latest.data ?? {}
  const testCases = Array.isArray(data.testCases) ? [...data.testCases] : []

  // Flag the first non-vacuous passing testcase as shallow (1 assertion).
  let flagged = false
  for (const tc of testCases) {
    if (tc.status === 'passed' && !tc.vacuous && !tc.shallow) {
      tc.shallow = true
      flagged = true
      break
    }
  }

  // Real escalation story: a fix attempt failed once, escalated to a human,
  // and was ultimately resolved by the fix commit below.
  data.loop = {
    pr: data.pr ?? '#12',
    classification: 'regression',
    action: 'escalated to human after 1 failed fix attempt',
    result: 'escalated',
    fixCommit: '1a84fd8410a6ed0fca3592c0fe948ced0b631c94',
  }

  await sql`update runs set data = ${JSON.stringify(data)}::jsonb where id = ${latest.id}`
  console.log(
    `patched run ${latest.id}: shallowFlagged=${flagged}, loop=${JSON.stringify(data.loop.result)}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
