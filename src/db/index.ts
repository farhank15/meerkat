// Lazy Neon connection via Drizzle. Server-only: every consumer is a server
// handler. Returns undefined when DATABASE_URL is absent so the app can boot
// without a database.
//
// Driver: @neondatabase/serverless (Postgres wire protocol over WebSocket/443)
// rather than a raw TCP socket. This keeps one code path for local development
// and Vercel, and works on networks that block outbound 5432.

import { Pool } from '@neondatabase/serverless'
import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless'

import * as schema from './schema'

type Db = NeonDatabase<typeof schema>

let client: { db: Db; close: () => void } | undefined

export function getDb(): Db | undefined {
  if (client) return client.db
  const url = process.env.DATABASE_URL
  if (!url) return undefined

  const pool = new Pool({ connectionString: url, max: 5 })
  client = { db: drizzle(pool, { schema }), close: () => void pool.end() }
  return client.db
}

export type { Db }
