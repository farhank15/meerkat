#!/usr/bin/env node
/**
 * db-audit.mjs — read-only preflight / postflight for the tenancy migration.
 *
 * Runs before 0001 to find rows that would block a NOT NULL constraint, and
 * after it to confirm every legacy row was backfilled. Never writes.
 *
 * Usage:
 *   node --env-file-if-exists=.env.local scripts/db-audit.mjs
 *   node --env-file-if-exists=.env.local scripts/db-audit.mjs --post --strict
 */

import { createPool } from './db-client.mjs'

const args = new Set(process.argv.slice(2))
const STRICT = args.has('--strict')
const POST = args.has('--post')

const pool = createPool()
const findings = []

function report(label, value, { blocking = false, hint = '' } = {}) {
  const ok = blocking ? value === 0 : true
  console.log(`  ${blocking ? (ok ? 'ok  ' : 'FAIL') : 'info'}  ${label}: ${value}${hint && !ok ? ` — ${hint}` : ''}`)
  if (!ok) findings.push({ label, value, hint })
}

async function hasTable(table) {
  const { rows } = await pool.query(
    `select 1 from information_schema.tables
     where table_schema = 'public' and table_name = $1`,
    [table],
  )
  return rows.length > 0
}

async function hasColumn(table, column) {
  const { rows } = await pool.query(
    `select 1 from information_schema.columns
     where table_schema = 'public' and table_name = $1 and column_name = $2`,
    [table, column],
  )
  return rows.length > 0
}

async function columnType(table, column) {
  const { rows } = await pool.query(
    `select data_type from information_schema.columns
     where table_schema = 'public' and table_name = $1 and column_name = $2`,
    [table, column],
  )
  return rows[0]?.data_type ?? null
}

async function count(query, params = []) {
  const { rows } = await pool.query(query, params)
  return rows[0].count
}

try {
  console.log(`Meerkat database audit (${POST ? 'post' : 'pre'}-migration)\n`)

  console.log('Tables')
  for (const table of ['workspaces', 'users', 'projects', 'runs', 'api_keys', 'schema_migrations']) {
    report(table, (await hasTable(table)) ? 'present' : 'missing')
  }

  console.log('\nRow counts')
  for (const table of ['workspaces', 'users', 'projects', 'runs', 'api_keys']) {
    if (!(await hasTable(table))) continue
    console.log(`  info  ${table}: ${await count(`select count(*)::int as count from ${table}`)}`)
  }

  if (await hasColumn('users', 'workspace_id')) {
    console.log('\nTenancy backfill')
    report(
      'users without workspace',
      await count('select count(*)::int as count from users where workspace_id is null'),
      { blocking: true, hint: '0001 backfill did not reach these rows' },
    )

    if (await hasColumn('projects', 'workspace_id')) {
      report(
        'projects without workspace',
        await count('select count(*)::int as count from projects where workspace_id is null'),
        { blocking: true, hint: '0001 backfill did not reach these rows' },
      )
    }

    if ((await hasColumn('api_keys', 'workspace_id')) && (await hasColumn('api_keys', 'revoked_at'))) {
      report(
        'active API keys without workspace',
        await count(
          'select count(*)::int as count from api_keys where workspace_id is null and revoked_at is null',
        ),
        { blocking: true, hint: 'revoke or attach them before 0003' },
      )
    }
  }

  if (await hasColumn('runs', 'started_at')) {
    report(
      'runs with a payload timestamp but no started_at',
      await count(`select count(*)::int as count from runs where started_at is null and data ? 'startedAt'`),
      { blocking: false, hint: 'ratchet falls back to created_at for these rows' },
    )
  }

  if (await hasColumn('runs', 'tsi')) {
    const tsiType = await columnType('runs', 'tsi')
    if (tsiType === 'jsonb') {
      report(
        'runs.tsi holding non-numeric jsonb',
        await count(
          `select count(*)::int as count from runs where tsi is not null and jsonb_typeof(tsi) <> 'number'`,
        ),
        { blocking: true, hint: '0002 will abort — inspect these rows' },
      )
    } else {
      console.log(`  info  runs.tsi type: ${tsiType} (0002 applied)`)
    }
  }

  if (await hasColumn('api_keys', 'prefix')) {
    const { rows } = await pool.query(
      'select prefix, count(*)::int as count from api_keys group by prefix having count(*) > 1',
    )
    report('duplicate API key prefixes', rows.length, {
      blocking: true,
      hint: 'the unique index cannot be created',
    })
  }

  if ((await hasTable('projects')) && (await hasColumn('projects', 'is_public'))) {
    console.log(
      `\n  info  public projects: ${await count('select count(*)::int as count from projects where is_public = true')}`,
    )
  }

  if (findings.length > 0) {
    console.log(`\n${findings.length} blocking finding(s).`)
    if (STRICT) process.exitCode = 1
  } else {
    console.log('\nNo blocking findings.')
  }
} catch (error) {
  console.error('audit failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end().catch(() => {})
}
