// Client-side session gate for the demo. The demo sets `mk_session=demo` after a
// successful login. Protected pages are wrapped in <AuthGate>, which decides on
// the client after mount so there is no SSR/client hydration mismatch.
// matcha: demo-only session — a production build would verify a signed session.

export const SESSION_COOKIE_NAME = 'mk_session'
export const SESSION_COOKIE_VALUE = 'demo'

/** Read auth state on the client only. On the server there is no document, so
 * this returns false — SSR must not leak protected content or gate on a cookie
 * it cannot see. Client navigations and full reloads both read document.cookie. */
export function isAuthed(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie
    .split(';')
    .map((c) => c.trim())
    .includes(`${SESSION_COOKIE_NAME}=${SESSION_COOKIE_VALUE}`)
}

/** Set the demo session cookie from the client after a successful login. */
export function setSession(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${SESSION_COOKIE_NAME}=${SESSION_COOKIE_VALUE}; path=/; max-age=86400; samesite=lax`
}

/** Clear the demo session cookie (sign out). */
export function clearSession(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`
}
