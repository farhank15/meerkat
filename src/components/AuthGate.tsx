// Client-effect auth gate. Renders nothing on the server and on the first client
// render (so SSR and hydration always match), then — after mount — either renders
// the protected children or redirects to /login. This avoids the hydration
// mismatch that a server-side cookie read would cause.

import { useEffect, useState } from 'react'
import { Navigate } from '@tanstack/react-router'
import { isAuthed } from '@/lib/session'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    setAuthed(isAuthed())
    setReady(true)
  }, [])

  if (!ready) return null
  if (!authed) return <Navigate to="/login" />
  return <>{children}</>
}
