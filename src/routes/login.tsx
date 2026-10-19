import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/login')({
  component: Login,
})

type Mode = 'signin' | 'register'

function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('signin')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(
    endpoint: '/api/auth/login' | '/api/auth/register',
    email: string,
    password: string,
  ) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const body = (await res.json()) as { ok?: boolean; error?: string }
      if (res.ok && body.ok) {
        navigate({ to: '/runs' })
      } else {
        setError(body.error ?? 'Invalid credentials')
      }
    } catch {
      setError('Network error — try again')
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    void submit(mode === 'signin' ? '/api/auth/login' : '/api/auth/register', String(fd.get('email') ?? ''), String(fd.get('password') ?? ''))
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-500/10 via-neutral-900 to-neutral-950 p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl"
        />
        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-400/30">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-400" fill="currentColor">
              <circle cx="6" cy="10" r="1.6" />
              <circle cx="12" cy="7" r="1.6" />
              <circle cx="18" cy="10" r="1.6" />
              <path d="M4 15c2 3 4.5 4.5 8 4.5S18 18 20 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-neutral-100">
            Meerkat
          </span>
        </Link>
        <div className="relative">
          <p className="text-2xl font-semibold leading-snug tracking-tight text-neutral-100">
            Know whether your green suite actually catches anything.
          </p>
          <p className="mt-4 max-w-sm text-sm text-neutral-400">
            Sign in to explore the dashboard, built from real TestSprite runs scored
            by the Test Strength Index.
          </p>
        </div>
        <p className="relative text-xs text-neutral-600">
          © 2026 Meerkat · TestSprite Hackathon Season 4
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-8">
        <form onSubmit={onSubmit} className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">
              {mode === 'signin' ? 'Welcome back' : 'Create your workspace'}
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              {mode === 'signin'
                ? 'Sign in to your workspace to continue.'
                : 'Register — the same account also works with GitHub below.'}
            </p>
          </div>

          <label className="block text-sm font-medium text-neutral-300">
            Email
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-900 px-3.5 py-2.5 text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-neutral-300">
            Password
            <input
              name="password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={mode === 'register' ? 8 : undefined}
              placeholder={mode === 'signin' ? '••••••••' : 'At least 8 characters'}
              className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-900 px-3.5 py-2.5 text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10"
            />
          </label>

          {error && (
            <p className="mt-3 text-xs text-rose-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-neutral-950 transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {busy ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>

          <a
            href="/api/auth/github"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-medium text-neutral-200 transition-colors hover:bg-white/10"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M8 0a8 8 0 0 0-2.5 15.6c.4.1.5-.2.5-.4v-1.4c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.3.9 1.3.9.7 1.2 2 .9 2.4.7.1-.5.3-.9.5-1.1-1.8-.2-3.7-.9-3.7-4 0-.9.3-1.6.8-2.2-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.6 7.6 0 0 1 4 0C11.6 3.2 12.3 3.4 12.3 3.4c.5 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.2 0 3.1-1.9 3.8-3.7 4 .3.3.6.8.6 1.5v2.2c0 .2.1.5.5.4A8 8 0 0 0 8 0" />
            </svg>
            Sign in with GitHub
          </a>

          <div className="mt-5 text-center text-xs text-neutral-500">
            {mode === 'signin' ? (
              <>
                Need an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register')
                    setError(null)
                  }}
                  className="text-emerald-400 underline-offset-2 hover:underline"
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-emerald-400 underline-offset-2 hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          {mode === 'signin' && (
            <details className="mt-4 rounded-xl border border-white/5 bg-white/3 px-3.5 py-3 text-xs text-neutral-500">
              <summary className="cursor-pointer select-none font-medium text-neutral-400">
                Checking the demo? Show demo credentials
              </summary>
              <p className="mt-2 font-mono text-neutral-400">
                demo@suitevitals.dev / demo-password-1
              </p>
            </details>
          )}
        </form>
      </div>
    </div>
  )
}
