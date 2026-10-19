// API key primitives. Server-only: the plaintext never reaches the client
// except as the single response of a create call.
//
// Format: mk_live_<8 hex prefix>_<43 char base64url secret>
// Stored: prefix (lookup handle) + sha256(secret). The secret is 256 bits of
// randomness, so a plain hash is sufficient — no KDF stretch needed.

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

const PREFIX_ROOT = 'mk_live_'

export interface GeneratedKey {
  plaintext: string
  prefix: string
  hash: string
}

export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex')
}

export function generateApiKey(): GeneratedKey {
  const handle = randomBytes(4).toString('hex')
  const secret = randomBytes(32).toString('base64url')
  return {
    plaintext: `${PREFIX_ROOT}${handle}_${secret}`,
    prefix: `${PREFIX_ROOT}${handle}`,
    hash: hashSecret(secret),
  }
}

export interface ParsedKey {
  prefix: string
  secret: string
}

export function parseApiKey(raw: string): ParsedKey | null {
  const value = raw.trim()
  if (!value.startsWith(PREFIX_ROOT)) return null

  const parts = value.split('_')
  // ['mk', 'live', handle, secret]
  if (parts.length !== 4) return null
  const [, , handle, secret] = parts
  if (!/^[0-9a-f]{8}$/.test(handle) || secret.length < 20) return null

  return { prefix: `${PREFIX_ROOT}${handle}`, secret }
}

export function verifySecret(secret: string, storedHash: string): boolean {
  const candidate = Buffer.from(hashSecret(secret), 'hex')
  const expected = Buffer.from(storedHash, 'hex')
  if (candidate.length !== expected.length) return false
  return timingSafeEqual(candidate, expected)
}

/** Display form: mk_live_1a2b3c4d•••••••• */
export function maskPrefix(prefix: string): string {
  return `${prefix}${'•'.repeat(8)}`
}
