import { useEffect, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/primitives'
import { Field, Input } from '@/components/ui/form'
import { GithubIcon } from '@/components/ui/icons'

export const Route = createFileRoute('/login')({
  // Marketing CTAs point at /login?mode=register so "Start free" opens the
  // account form instead of asking a first-time visitor to sign in.
  validateSearch: (search: Record<string, unknown>): { mode?: 'register' } => ({
    mode: search.mode === 'register' ? 'register' : undefined,
  }),
  component: Login,
})

type Mode = 'signin' | 'register'

function Login() {
  const navigate = useNavigate()
  const { mode: requestedMode } = Route.useSearch()
  const [mode, setMode] = useState<Mode>(requestedMode ?? 'signin')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/auth/me')
      .then((response) => response.json())
      .then((body: { authed?: boolean; workspace?: { onboarded?: boolean } | null }) => {
        if (!alive) return
        if (body.authed === true) {
          navigate({ to: body.workspace?.onboarded ? '/dashboard' : '/onboarding', replace: true })
        }
      })
      .catch(() => {
        // A failed probe only means "not signed in" — the form stays usable.
      })
    return () => {
      alive = false
    }
  }, [navigate])

  async function submit(
    endpoint: '/api/auth/login' | '/api/auth/register',
    email: string,
    password: string,
  ) {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const body = (await response.json()) as {
        ok?: boolean
        error?: string
        onboarded?: boolean
      }
      if (response.ok && body.ok) {
        navigate({ to: body.onboarded ? '/dashboard' : '/onboarding' })
      } else {
        setError(body.error ?? 'Invalid credentials')
      }
    } catch {
      setError('Network error — try again')
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    void submit(
      mode === 'signin' ? '/api/auth/login' : '/api/auth/register',
      String(form.get('email') ?? ''),
      String(form.get('password') ?? ''),
    )
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-surface p-12 lg:flex">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-accent/25 bg-accent/10">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent" fill="currentColor" aria-hidden>
              <circle cx="6" cy="10" r="1.6" />
              <circle cx="12" cy="7" r="1.6" />
              <circle cx="18" cy="10" r="1.6" />
              <path d="M4 15c2 3 4.5 4.5 8 4.5S18 18 20 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-sm font-semibold text-ink">Meerkat</span>
        </Link>

        <div>
          <p className="max-w-sm text-2xl font-semibold leading-snug tracking-tight text-ink">
            Know whether your green suite actually catches anything.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
            Every account gets its own workspace. Projects, runs and keys are isolated — you will
            never see another team&apos;s evidence.
          </p>
        </div>

        <p className="text-2xs text-ink-subtle">© 2026 Meerkat · TestSprite Hackathon Season 4</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              {mode === 'signin' ? 'Sign in' : 'Create your workspace'}
            </h1>
            <p className="mt-1 text-xs text-ink-muted">
              {mode === 'signin'
                ? 'Continue to your workspace.'
                : 'One account, one workspace. No sample data.'}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="you@example.com"
              />
            </Field>
            <Field
              label="Password"
              htmlFor="password"
              hint={mode === 'register' ? 'At least 8 characters.' : undefined}
            >
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={mode === 'register' ? 8 : undefined}
                placeholder="••••••••"
              />
            </Field>

            {error && (
              <p className="text-2xs text-danger" role="alert">
                {error}
              </p>
            )}

            <Button variant="primary" type="submit" disabled={busy} className="w-full">
              {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-2xs uppercase tracking-wider text-ink-subtle">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <a
            href="/api/auth/github"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-line bg-surface-raised px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface-hover"
          >
            <GithubIcon width={15} height={15} />
            Continue with GitHub
          </a>

          <p className="mt-5 text-center text-2xs text-ink-subtle">
            {mode === 'signin' ? (
              <>
                Need an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register')
                    setError(null)
                  }}
                  className="text-accent hover:text-accent-strong"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin')
                    setError(null)
                  }}
                  className="text-accent hover:text-accent-strong"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
