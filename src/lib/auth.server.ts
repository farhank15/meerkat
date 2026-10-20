// Server-side identity: password hashing, HMAC-signed sessions, and the one
// function that turns a request into a { user, workspace } pair.
//
// Tenancy rule: every authenticated query is scoped by `workspace.id` from
// `resolveSession()`. A user belongs to exactly one workspace today; the schema
// leaves room for a members table later without changing this contract.

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { projects, users, workspaces } from '@/db/schema'

export const SESSION_COOKIE = 'mk_session'

/** Bootstrap account kept for the TestSprite suite and the public showcase. */
export const DEMO_EMAIL = 'demo@suitevitals.dev'
export const DEMO_PASSWORD = 'demo-password-1'
export const DEMO_PROJECT_SLUG = 'meerkat-demo'
export const DEMO_PROJECT_REPO = 'https://github.com/farhank15/meerkat'

const IS_PROD = process.env.NODE_ENV === 'production'
const AUTH_SECRET = process.env.AUTH_SECRET
if (IS_PROD && !AUTH_SECRET) {
  throw new Error('AUTH_SECRET must be set in production')
}
const RESOLVED_SECRET = AUTH_SECRET ?? 'meerkat-dev-secret-do-not-use-in-prod'

// ── Passwords ────────────────────────────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false
  const [algo, salt, hash] = stored.split(':')
  if (algo !== 'scrypt' || !salt || !hash) return false
  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

// ── Sessions (stateless, HMAC-signed) ───────────────────────────────────────

export interface SessionClaims {
  uid: string
  email: string
  /** Workspace id. Optional so tokens minted before the refactor stay valid. */
  wid?: string
  exp: number
  /** Claims version — bump when the shape changes. */
  v?: number
}

function encode(payload: SessionClaims): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', RESOLVED_SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

function decode(token: string): SessionClaims | undefined {
  const [body, sig] = token.split('.')
  if (!body || !sig) return undefined
  const expected = createHmac('sha256', RESOLVED_SECRET).update(body).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return undefined
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionClaims
  } catch {
    return undefined
  }
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000

/** RFC 6265 cookie string; HttpOnly so scripts cannot lift the token. */
export function sessionCookie(userId: string, email: string, workspaceId?: string): string {
  const token = encode({
    uid: userId,
    email,
    wid: workspaceId,
    exp: Date.now() + SESSION_TTL_MS,
    v: 1,
  })
  const flags = ['Path=/', 'Max-Age=86400', 'HttpOnly', 'SameSite=Lax']
  if (IS_PROD) flags.push('Secure')
  return `${SESSION_COOKIE}=${token}; ${flags.join('; ')}`
}

export function clearSessionCookie(): string {
  const flags = ['Path=/', 'Max-Age=0', 'HttpOnly', 'SameSite=Lax']
  if (IS_PROD) flags.push('Secure')
  return `${SESSION_COOKIE}=; ${flags.join('; ')}`
}

export function readSession(request: Request): SessionClaims | undefined {
  const header = request.headers.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name !== SESSION_COOKIE) continue
    const claims = decode(rest.join('='))
    if (claims && claims.exp > Date.now()) return claims
  }
  return undefined
}

// ── Tenancy ─────────────────────────────────────────────────────────────────

export type UserRow = typeof users.$inferSelect
export type WorkspaceRow = typeof workspaces.$inferSelect

export interface SessionContext {
  user: UserRow
  workspace: WorkspaceRow
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

async function uniqueWorkspaceSlug(base: string): Promise<string> {
  const db = getDb()
  if (!db) return `${base}-${randomBytes(3).toString('hex')}`

  const root = slugify(base) || 'workspace'
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? root : `${root}-${attempt + 1}`
    const [taken] = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.slug, candidate))
      .limit(1)
    if (!taken) return candidate
  }
  return `${root}-${randomBytes(4).toString('hex')}`
}

/**
 * Guarantees a workspace for a user. Legacy rows (created before the tenancy
 * migration) get one lazily on their next authenticated request.
 */
export async function ensureWorkspaceForUser(user: UserRow): Promise<WorkspaceRow | undefined> {
  const db = getDb()
  if (!db) return undefined

  if (user.workspaceId) {
    const [existing] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, user.workspaceId))
      .limit(1)
    if (existing) return existing
  }

  const localPart = user.email.split('@')[0] ?? 'workspace'
  const name = user.name?.trim() || `${localPart}'s workspace`
  const slug = await uniqueWorkspaceSlug(localPart)

  const [created] = await db.insert(workspaces).values({ name, slug }).returning()
  await db.update(users).set({ workspaceId: created.id }).where(eq(users.id, user.id))
  return created
}

/**
 * Creates a user and its workspace atomically. The workspace is the tenant
 * boundary, so a user without one is never a valid state.
 */
export async function createAccount(input: {
  email: string
  passwordHash?: string | null
  githubId?: string | null
  name?: string | null
  avatarUrl?: string | null
}): Promise<{ user: UserRow; workspace: WorkspaceRow } | undefined> {
  const db = getDb()
  if (!db) return undefined

  return db.transaction(async (tx) => {
    const localPart = input.email.split('@')[0] ?? 'workspace'
    const baseSlug = slugify(localPart) || 'workspace'

    // Slug uniqueness inside the transaction: retry on conflict is overkill for
    // this volume, so a random suffix is appended when the base is taken.
    const [collision] = await tx
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.slug, baseSlug))
      .limit(1)
    const slug = collision ? `${baseSlug}-${randomBytes(3).toString('hex')}` : baseSlug

    const [workspace] = await tx
      .insert(workspaces)
      .values({ name: input.name?.trim() || `${localPart}'s workspace`, slug })
      .returning()

    const [user] = await tx
      .insert(users)
      .values({
        email: input.email,
        passwordHash: input.passwordHash ?? null,
        githubId: input.githubId ?? null,
        name: input.name ?? null,
        avatarUrl: input.avatarUrl ?? null,
        workspaceId: workspace.id,
        role: 'owner',
        lastLoginAt: new Date(),
      })
      .returning()

    return { user, workspace }
  })
}

/**
 * Resolves the caller into { user, workspace } or undefined. Single source of
 * truth for authorization — routes must never read the cookie directly.
 */
export async function resolveSession(request: Request): Promise<SessionContext | undefined> {
  const claims = readSession(request)
  if (!claims) return undefined

  const db = getDb()
  if (!db) return undefined

  const [user] = await db.select().from(users).where(eq(users.id, claims.uid)).limit(1)
  if (!user) return undefined

  const workspace = await ensureWorkspaceForUser(user)
  if (!workspace) return undefined

  return { user, workspace }
}

export async function findUserByEmail(email: string) {
  const db = getDb()
  if (!db) return undefined
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return rows[0]
}

/**
 * Optional bootstrap: creates the showcase account + project only when both
 * env vars are present. Never seeds fake runs — the project is meant to hold
 * real ingested waves.
 */
export async function ensureBootstrapAccount(): Promise<void> {
  const email = process.env.BOOTSTRAP_EMAIL
  const password = process.env.BOOTSTRAP_PASSWORD
  if (!email || !password) return

  const db = getDb()
  if (!db) return

  try {
    let existing = await findUserByEmail(email)
    if (!existing) {
      const created = await createAccount({ email, passwordHash: hashPassword(password) })
      existing = created?.user
    }
    if (!existing?.workspaceId) return

    await db
      .insert(projects)
      .values({
        workspaceId: existing.workspaceId,
        slug: DEMO_PROJECT_SLUG,
        name: 'Meerkat',
        repoUrl: DEMO_PROJECT_REPO,
        isPublic: true,
      })
      .onConflictDoNothing({ target: projects.slug })
  } catch (error) {
    console.error('[auth] bootstrap skipped:', (error as Error).message)
  }
}
