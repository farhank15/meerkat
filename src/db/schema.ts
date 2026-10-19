import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  /** scrypt hash; null for GitHub-only accounts. */
  passwordHash: text('password_hash'),
  githubId: text('github_id').unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  repoUrl: text('repo_url'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const runs = pgTable('runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  /** cli | portal | github_action | mcp | schedule — mirrors TestSprite run sources. */
  source: text('source').notNull().default('cli'),
  sha: text('sha'),
  pr: text('pr'),
  branch: text('branch'),
  /** complete | incomplete | parse-error */
  status: text('status').notNull().default('complete'),
  tsi: jsonb('tsi'),
  /** The full run payload, Run-shaped, so the dashboard can render it verbatim. */
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
