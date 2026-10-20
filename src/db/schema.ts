// Database schema — tenancy-first.
//
// Spine: workspaces → projects → runs. A user belongs to exactly one workspace
// today (users.workspace_id); the shape still allows a future `members` table
// without a rewrite, because nothing keys off "the user owns the project".
//
// Column types here must match src/db/migrations/manual/*.sql. Drizzle is the
// typed query layer only — the SQL files are the source of truth for DDL.

import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  /** Null until the onboarding wizard is completed. */
  onboardedAt: timestamp('onboarded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    /** scrypt hash; null for GitHub-only accounts. */
    passwordHash: text('password_hash'),
    githubId: text('github_id').unique(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name'),
    avatarUrl: text('avatar_url'),
    /** owner | member — members arrive with the team plan. */
    role: text('role').notNull().default('owner'),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('users_workspace_idx').on(table.workspaceId)],
)

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    repoUrl: text('repo_url'),
    /** github | generic */
    provider: text('provider').notNull().default('github'),
    defaultBranch: text('default_branch'),
    /** Public projects are readable without a session (scorecard, badge, brief). */
    isPublic: boolean('is_public').notNull().default(false),
    badgeEnabled: boolean('badge_enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('projects_workspace_idx').on(table.workspaceId)],
)

export const runs = pgTable(
  'runs',
  {
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
    /** Null means withheld, never zero. */
    tsi: integer('tsi'),
    /** The full run payload, Run-shaped, so the dashboard can render it verbatim. */
    data: jsonb('data').notNull(),
    /** When the TestSprite wave started — the true chronological axis. */
    startedAt: timestamp('started_at', { withTimezone: true }),
    /** Stable identity for a wave; the unique index makes re-ingest idempotent. */
    dedupeKey: text('dedupe_key'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('runs_project_created_idx').on(table.projectId, table.createdAt),
    index('runs_project_started_idx').on(table.projectId, table.startedAt),
    index('runs_project_sha_idx').on(table.projectId, table.sha),
    uniqueIndex('runs_project_dedupe_uq')
      .on(table.projectId, table.dedupeKey)
      .where(sql`${table.dedupeKey} is not null`),
  ],
)

export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    /** Null = workspace-wide key (may ingest into any project it names). */
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    /** Public lookup handle: mk_live_<prefix>_<secret>. */
    prefix: text('prefix').notNull(),
    /** sha256(secret) — the plaintext is never stored. */
    keyHash: text('key_hash').notNull(),
    /** ingest | read */
    scopes: text('scopes').array().notNull().default(sql`array['ingest', 'read']::text[]`),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('api_keys_prefix_uq').on(table.prefix),
    uniqueIndex('api_keys_hash_uq').on(table.keyHash),
    index('api_keys_workspace_idx').on(table.workspaceId),
  ],
)
