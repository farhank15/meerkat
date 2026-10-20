#!/usr/bin/env node
/**
 * db-migrate.mjs — apply hand-written, idempotent SQL migrations in order.
 *
 * Why not `drizzle-kit migrate`: this database was created by hand and has no
 * drizzle journal or snapshot. `generate` would emit CREATE TABLE for tables
 * that already exist and `push` could drop columns. The SQL files here are the
 * source of truth; drizzle is used for the typed query layer only.
 *
 * Usage:
 *   node --env-file-if-exists=.env.local scripts/db-migrate.mjs --status
 *   node --env-file-if-exists=.env.local scripts/db-migrate.mjs --dry-run
 *   node --env-file-if-exists=.env.local scripts/db-migrate.mjs
 */

import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { createPool } from './db-client.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.resolve(HERE, '../src/db/migrations/manual')

const args = new Set(process.argv.slice(2))
const DRY_RUN = args.has('--dry-run')
const STATUS_ONLY = args.has('--status')

/** Lexical order is the contract: 0001, 0002, 0003. */
async function listMigrations() {
  const entries = await readdir(MIGRATIONS_DIR)
  return entries.filter((name) => name.endsWith('.sql')).sort((a, b) => a.localeCompare(b))
}

const pool = createPool()

try {
  await pool.query(`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `)

  const { rows } = await pool.query('select name from schema_migrations')
  const applied = new Set(rows.map((row) => row.name))
  const migrations = await listMigrations()
  const pending = migrations.filter((name) => !applied.has(name))

  if (STATUS_ONLY) {
    for (const name of migrations) console.log(`${applied.has(name) ? 'applied' : 'pending'}  ${name}`)
    process.exit(0)
  }

  if (pending.length === 0) {
    console.log('Nothing to apply — database is up to date.')
    process.exit(0)
  }

  if (DRY_RUN) {
    console.log('Would apply:')
    for (const name of pending) console.log(`  ${name}`)
    process.exit(0)
  }

  for (const name of pending) {
    const body = await readFile(path.join(MIGRATIONS_DIR, name), 'utf8')
    process.stdout.write(`applying ${name} … `)
    // The file owns its BEGIN/COMMIT. A parameterless query uses the simple
    // protocol, which accepts multiple statements and dollar-quoted blocks.
    await pool.query(body)
    await pool.query('insert into schema_migrations (name) values ($1)', [name])
    console.log('ok')
  }

  console.log(`Applied ${pending.length} migration(s).`)
} catch (error) {
  console.error('\nmigration failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end().catch(() => {})
}
