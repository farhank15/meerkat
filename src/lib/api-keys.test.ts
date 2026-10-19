import { describe, expect, it } from 'vitest'

import { generateApiKey, hashSecret, parseApiKey, verifySecret } from './api-keys.server'

describe('api keys', () => {
  it('round-trips a generated key', () => {
    const generated = generateApiKey()
    const parsed = parseApiKey(generated.plaintext)

    expect(parsed).not.toBeNull()
    expect(parsed?.prefix).toBe(generated.prefix)
    expect(verifySecret(parsed!.secret, generated.hash)).toBe(true)
  })

  it('parses a secret that contains the separator', () => {
    // base64url uses `_`, so splitting on every underscore would reject roughly
    // half of all generated keys.
    const secret = 'abc_def-ghi_jkl_mno_pqr_stu_vwx_yz0123456789'
    const parsed = parseApiKey(`mk_live_1a2b3c4d_${secret}`)

    expect(parsed).toEqual({ prefix: 'mk_live_1a2b3c4d', secret })
  })

  it('rejects malformed keys', () => {
    expect(parseApiKey('')).toBeNull()
    expect(parseApiKey('sk_live_1a2b3c4d_secret')).toBeNull()
    expect(parseApiKey('mk_live_nothex12_secret')).toBeNull()
    expect(parseApiKey('mk_live_1a2b3c4d_short')).toBeNull()
    expect(parseApiKey('mk_live_1a2b3c4d')).toBeNull()
  })

  it('verifies only the matching secret', () => {
    const hash = hashSecret('correct-secret')
    expect(verifySecret('correct-secret', hash)).toBe(true)
    expect(verifySecret('wrong-secret', hash)).toBe(false)
  })
})
