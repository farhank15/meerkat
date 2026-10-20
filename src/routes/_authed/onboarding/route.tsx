import { Link, Outlet, createFileRoute, useRouter } from '@tanstack/react-router'

import type { AppSession } from '@/server/session'

export const Route = createFileRoute('/_authed/onboarding')({
  component: OnboardingLayout,
})

function OnboardingLayout() {
  const { session } = Route.useRouteContext() as { session: AppSession }
  const router = useRouter()

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    await router.navigate({ to: '/login' })
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-5">
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
          <div className="flex items-center gap-3 text-2xs text-ink-subtle">
            <span className="hidden sm:inline">{session.user.email}</span>
            <button type="button" onClick={signOut} className="transition-colors hover:text-ink">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
