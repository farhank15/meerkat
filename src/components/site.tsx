// Shared site chrome: navigation, footer, layout primitives, and the TSI score
// card used across the marketing surface. Kept dependency-free (inline SVG only)
// so it renders identically on the server and the client.

import { useEffect, useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { isAuthed } from '@/lib/session'

export function Container({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={`mx-auto w-full max-w-6xl px-6 ${className}`}>{children}</div>
}

export function Section({
  id,
  className = '',
  children,
}: {
  id?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className={`py-20 sm:py-24 ${className}`}>
      <Container>{children}</Container>
    </section>
  )
}

function Wordmark() {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-400/30">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-400" fill="currentColor">
          <circle cx="6" cy="10" r="1.6" />
          <circle cx="12" cy="7" r="1.6" />
          <circle cx="18" cy="10" r="1.6" />
          <path
            d="M4 15c2 3 4.5 4.5 8 4.5S18 18 20 15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-neutral-100">
        Meerkat
      </span>
    </Link>
  )
}

/** Reads client auth state after mount and re-checks on every navigation. SSR and
 * the first client render stay on the default (signed-out) UI so there is no
 * hydration mismatch; the effect then reflects the cookie. Re-running on pathname
 * change is what makes the header update right after login (SPA nav does not
 * remount the Nav). */
function useAuth() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [mounted, setMounted] = useState(false)
  const [authed, setAuthed] = useState(false)
  /** Real account email now lives server-side (HttpOnly session) — surfaced via /api/auth/me. */
  const [email, setEmail] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((body: { authed?: boolean; email?: string | null }) => {
        const confirmed = body.authed === true
        // Fallback to the legacy client cookie while that session expires.
        setAuthed(confirmed || isAuthed())
        setEmail(body.email ?? null)
        setMounted(true)
      })
      .catch(() => {
        setAuthed(isAuthed())
        setMounted(true)
      })
  }, [pathname])
  return { mounted, authed, email }
}

export function Nav() {
  const { mounted, authed, email } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-neutral-950/70 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        <Wordmark />
        <nav className="hidden items-center gap-8 text-sm text-neutral-400 md:flex">
          <a href="/#how" className="transition-colors hover:text-neutral-100">
            How it works
          </a>
          <a href="/#tsi" className="transition-colors hover:text-neutral-100">
            The TSI
          </a>
          <a href="/loop" className="transition-colors hover:text-neutral-100">
            The Loop
          </a>
          <a href="/agent" className="transition-colors hover:text-neutral-100">
            For agents
          </a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Default (SSR + pre-mount) renders the signed-out affordance so the
              server and client markup always match. */}
          {mounted && authed ? (
            <span className="relative" data-testid="user-menu">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="group flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3 transition-colors hover:border-white/20"
              >
                {/* Avatar: deterministic initial from the email — no external image, SSR-safe. */}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                  {(email ?? 'demo@suitevitals.dev').slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden max-w-44 truncate text-sm text-neutral-300 sm:inline">
                  {email ?? 'demo@suitevitals.dev'}
                </span>
                <svg
                  viewBox="0 0 12 12"
                  className="h-2.5 w-2.5 text-neutral-500"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  {/* Backdrop click-outside closes without a portal. */}
                  <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl shadow-black/50"
                  >
                    <div className="border-b border-white/5 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wider text-neutral-500">
                        Signed in
                      </div>
                      <div className="mt-0.5 truncate text-sm font-medium text-neutral-200">
                        {email ?? 'demo@suitevitals.dev'}
                      </div>
                    </div>
                    <nav className="p-1.5 text-sm">
                      <MenuItem href="/runs" onClick={() => setMenuOpen(false)}>
                        Runs
                      </MenuItem>
                      <MenuItem href="/auditor" onClick={() => setMenuOpen(false)}>
                        Vacuous Auditor
                      </MenuItem>
                      <MenuItem href="/score" onClick={() => setMenuOpen(false)}>
                        Scoring engine
                      </MenuItem>
                      <MenuItem href="/agent" onClick={() => setMenuOpen(false)}>
                        For agents · MCP
                      </MenuItem>
                    </nav>
                    <div className="border-t border-white/5 p-1.5">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={async () => {
                          setMenuOpen(false)
                          // Server-side logout clears the HttpOnly session cookie.
                          await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
                          navigate({ to: '/' })
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-300 transition-colors hover:bg-rose-500/10"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </span>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-neutral-400 transition-colors hover:text-neutral-100"
              >
                Sign in
              </Link>
              <Link
                to="/runs"
                className="rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-neutral-950 transition-colors hover:bg-emerald-500"
              >
                View demo
              </Link>
            </>
          )}
        </div>
      </Container>
    </header>
  )
}

function MenuItem({
  href,
  children,
  onClick,
}: {
  href: string
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <a
      href={href}
      role="menuitem"
      onClick={onClick}
      className="block rounded-lg px-3 py-2 text-neutral-300 transition-colors hover:bg-white/5 hover:text-neutral-100"
    >
      {children}
    </a>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-neutral-950">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Wordmark />
          <p className="max-w-xs text-sm text-neutral-500">
            The Test Strength Index. Know whether your green suite actually catches
            anything.
          </p>
        </div>
        <FooterCol
          title="Product"
          links={[
            { label: 'The TSI', href: '/#tsi' },
            { label: 'How it works', href: '/#how' },
            { label: 'The Loop', href: '/loop' },
            { label: 'For agents', href: '/agent' },
            { label: 'Demo scorecard', href: '/runs' },
            { label: 'Public scorecard', href: '/share/meerkat-demo' },
          ]}
        />
        <FooterCol
          title="Built with"
          links={[
            { label: 'TestSprite', href: 'https://testsprite.com' },
            { label: 'TanStack Start', href: 'https://tanstack.com/start' },
            { label: 'Vercel', href: 'https://vercel.com' },
          ]}
        />
        <FooterCol
          title="Hackathon"
          links={[
            { label: 'Season 4', href: 'https://www.testsprite.com/hackathon-s4' },
            { label: 'Scoring', href: '/score' },
          ]}
        />
      </Container>
      <Container className="flex flex-col items-start justify-between gap-3 border-t border-white/5 py-6 text-xs text-neutral-600 sm:flex-row sm:items-center">
        <span>© 2026 Meerkat. Built for TestSprite Hackathon Season 4.</span>
        <span>Coverage · Stability · Meaningful pass-rate</span>
      </Container>
    </footer>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {title}
      </div>
      <ul className="space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-neutral-400 transition-colors hover:text-neutral-100"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The headline TSI scorecard. Reused on the hero and the demo dashboard. */
export function ScoreCard({
  tsi,
  coverage,
  stability,
  passRate,
  runId,
  className = '',
}: {
  tsi: number
  coverage: number
  stability: number
  passRate: number
  /** When set, the score links to that run's TSI source breakdown. */
  runId?: string
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-neutral-900/60 p-7 shadow-2xl shadow-emerald-500/5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Test Strength Index
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
          Live
        </span>
      </div>
      {runId ? (
        <Link
          to="/runs/$id"
          params={{ id: runId }}
          hash="tsi-breakdown"
          className="mt-3 block text-6xl font-bold tabular-nums tracking-tight text-neutral-50 transition-colors hover:text-emerald-300"
          aria-label="Inspect TSI source breakdown"
        >
          {tsi}
        </Link>
      ) : (
        <div className="mt-3 text-6xl font-bold tabular-nums tracking-tight text-neutral-50">
          {tsi}
        </div>
      )}
      <div className="mt-7 grid grid-cols-3 gap-3">
        <Metric label="Coverage" value={coverage} hint="50%" />
        <Metric label="Stability" value={stability} hint="30%" />
        <Metric label="Pass rate" value={passRate} hint="20%" />
      </div>
      {runId && (
        <div className="mt-5 border-t border-white/5 pt-4">
          <Link
            to="/runs/$id"
            params={{ id: runId }}
            hash="tsi-breakdown"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 transition-colors hover:text-emerald-300"
          >
            View source breakdown →
          </Link>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-neutral-950/40 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-neutral-500">{label}</span>
        <span className="text-[10px] text-neutral-600">{hint}</span>
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-neutral-200">
        {(value * 100).toFixed(0)}%
      </div>
    </div>
  )
}
