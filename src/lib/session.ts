// Client-side session gate for the demo. The demo sets `mk_session=demo` after a
// successful login. Server-rendered pages degrade to rendering (SSR), and the
// client redirects to /login when unauthenticated.
// matcha: demo-only session — a production build would verify a signed session.

export const SESSION_COOKIE = 'mk_session=demo'

export function isAuthed(): boolean {
  if (typeof document === 'undefined') return true
  return document.cookie.includes(SESSION_COOKIE)
}

export function setSession(): void {
  if (typeof document === 'undefined') return
  document.cookie = 'mk_session=demo; path=/; max-age=86400; samesite=lax'
}
