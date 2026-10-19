// Server-side auth utilities: scrypt password hashing, HMAC-signed stateless
// session tokens, and idempotent seeding of the demo account/project so the
// demo flow (and the TestSprite suite) keeps working on a fresh database.

import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto'

import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { projects, users } from '@/db/schema'

export const SESSION_COOKIE = 'mk_session'
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

interface SessionClaims {
  uid: string
  email: string
  exp: number // epoch ms
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
export function sessionCookie(userId: string, email: string): string {
  const token = encode({ uid: userId, email, exp: Date.now() + SESSION_TTL_MS })
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

// ── Demo seeding (idempotent) ───────────────────────────────────────────────

const seeded = new Set<string>()

/** Ensures the demo user + project exist. Cheap: runs at most once per key. */
export async function ensureDemoSeed(): Promise<void> {
  const db = getDb()
  if (!db || seeded.has('demo')) return

  // Seed only the tables we need — if the schema is missing (migration not
  // applied yet), log and continue: the app falls back to fixture data.
  try {
    await db
      .insert(users)
      .values({
        email: DEMO_EMAIL,
        passwordHash: hashPassword(DEMO_PASSWORD),
      })
      .onConflictDoNothing({ target: users.email })

    await db
      .insert(projects)
      .values({
        slug: DEMO_PROJECT_SLUG,
        name: 'Meerkat',
        repoUrl: DEMO_PROJECT_REPO,
      })
      .onConflictDoNothing({ target: projects.slug })

    seeded.add('demo')
  } catch (err) {
    console.error('[auth] demo seed skipped:', (err as Error).message)
  }
}

export async function findUserByEmail(email: string) {
  const db = getDb()
  if (!db) return undefined
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return rows[0]
}
