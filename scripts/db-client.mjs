/**
 * db-client.mjs — shared database connector for the operator scripts.
 *
 * This machine cannot reach Neon over TCP/5432 (the socket opens, then no
 * payload flows), but HTTPS/443 works. `@neondatabase/serverless` speaks the
 * Postgres wire protocol over a WebSocket on 443. The application uses the same
 * driver (src/db/index.ts), so operator scripts and the app share one transport.
 */

import { Pool } from '@neondatabase/serverless'

export function createPool() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Use --env-file-if-exists=.env.local or export it.')
  }
  return new Pool({ connectionString, max: 1 })
}
