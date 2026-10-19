// Client-effect auth gate. Renders nothing on the server and on the first
// client render (so SSR and hydration always match), then — after mount — asks
// the server whether the signed HttpOnly session cookie is valid /api/auth/me.
// This replaced the old document.cookie check: HttpOnly cookies cannot be read
// from JS, by design.

import { useEffect, useState } from 'react'
import { Navigate } from '@tanstack/react-router'

import { isAuthed } from '@/lib/session'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let alive = true

    // Fast path while the server confirms the HttpOnly session.
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((body: { authed?: boolean; email?: string | null }) => {
        if (!alive) return
        const confirmed = body.authed === true
        // Fallback for legacy demo cookie (pre-HttpOnly sessions still lying around).
        setAuthed(confirmed || isAuthed())
        setReady(true)
      })
      .catch(() => {
        if (!alive) return
        setAuthed(isAuthed())
        setReady(true)
      })

    return () => {
      alive = false
    }
  }, [])

  if (!ready) return null
  if (!authed) return <Navigate to="/login" />
  return <>{children}</>
}
