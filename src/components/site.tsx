// Shared site chrome: navigation, footer, layout primitives, and the TSI score
// card used across the marketing surface. Kept dependency-free (inline SVG only)
// so it renders identically on the server and the client.

import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { isAuthed, clearSession } from '@/lib/session'

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

/** Reads client auth state after mount. SSR and first client render stay on the
 * default (signed-out) UI so there is no hydration mismatch. */
function useAuth() {
  const [mounted, setMounted] = useState(false)
  const [authed, setAuthed] = useState(false)
  useEffect(() => {
    setAuthed(isAuthed())
    setMounted(true)
  }, [])
  return { mounted, authed }
}

export function Nav() {
  const { mounted, authed } = useAuth()
  const navigate = useNavigate()

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
          <a href="/#loop" className="transition-colors hover:text-neutral-100">
            The Loop
          </a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Default (SSR + pre-mount) renders the signed-out affordance so the
              server and client markup always match. */}
          {mounted && authed ? (
            <>
              <span className="hidden text-sm text-neutral-400 sm:inline">
                demo@suitevitals.dev
              </span>
              <button
                type="button"
                onClick={() => {
                  clearSession()
                  navigate({ to: '/' })
                }}
                className="rounded-lg border border-white/10 px-3.5 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-white/20 hover:text-neutral-100"
              >
                Sign out
              </button>
            </>
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
            { label: 'The Loop', href: '/#loop' },
            { label: 'Demo scorecard', href: '/runs' },
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
  className = '',
}: {
  tsi: number
  coverage: number
  stability: number
  passRate: number
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
      <div className="mt-3 text-6xl font-bold tabular-nums tracking-tight text-neutral-50">
        {tsi}
      </div>
      <div className="mt-7 grid grid-cols-3 gap-3">
        <Metric label="Coverage" value={coverage} hint="50%" />
        <Metric label="Stability" value={stability} hint="30%" />
        <Metric label="Pass rate" value={passRate} hint="20%" />
      </div>
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
