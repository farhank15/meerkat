#!/usr/bin/env node
/**
 * db-backup.mjs — logical backup of every table the tenancy refactor touches.
 *
 * No pg_dump on this machine and no Neon CLI, so this writes JSON rows through
 * the driver already in the project. It is a data backup, not a schema dump:
 * the migrations are additive, so restoring schema is never required.
 *
 * Usage:
 *   node --env-file-if-exists=.env.local scripts/db-backup.mjs
 *   node --env-file-if-exists=.env.local scripts/db-backup.mjs --out backups/name
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { createPool } from './db-client.mjs'

const args = process.argv.slice(2)
const outIndex = args.indexOf('--out')
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const outDir =
  outIndex >= 0 && args[outIndex + 1]
    ? path.resolve(args[outIndex + 1])
    : path.resolve(`backups/pre-tenancy-${stamp}`)

const TABLES = ['users', 'projects', 'runs', 'api_keys', 'workspaces', 'schema_migrations']

const pool = createPool()

try {
  await mkdir(outDir, { recursive: true })
  const manifest = { createdAt: new Date().toISOString(), tables: {} }

  for (const table of TABLES) {
    try {
      const { rows } = await pool.query(`select * from ${table}`)
      await writeFile(path.join(outDir, `${table}.json`), JSON.stringify(rows, null, 2))
      manifest.tables[table] = rows.length
      console.log(`  ${table}: ${rows.length} row(s)`)
    } catch (error) {
      manifest.tables[table] = `skipped: ${error.message.split('\n')[0]}`
      console.log(`  ${table}: skipped (${error.message.split('\n')[0]})`)
    }
  }

  await writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`\nBackup written to ${outDir}`)
} catch (error) {
  console.error('backup failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end().catch(() => {})
}
