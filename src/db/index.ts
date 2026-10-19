// Lazy Neon (Postgres) connection via Drizzle. Server-only: every consumer is a
// server handler. Returns undefined when DATABASE_URL is absent, so the app
// keeps running (fixture fallback) without a database.

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

type Db = PostgresJsDatabase<typeof schema>

let client: { db: Db; close: () => void } | undefined

export function getDb(): Db | undefined {
  if (client) return client.db
  const url = process.env.DATABASE_URL
  if (!url) return undefined
  const pg = postgres(url, { prepare: false, max: 5 })
  client = { db: drizzle(pg, { schema }), close: () => void pg.end() }
  return client.db
}

export type { Db }
