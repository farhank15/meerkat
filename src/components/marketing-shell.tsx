// Public marketing chrome. Only routes under _marketing/ render this; the
// authenticated app has its own shell and never shows marketing navigation.

import { useState } from 'react'
import { Link } from '@tanstack/react-router'

import { cn } from '@/lib/cn'
import type { AppSession } from '@/server/session'
import { Button } from '@/components/ui/primitives'
import { AccountMenu } from '@/components/account-menu'
import { CloseIcon, GithubIcon, MenuIcon } from '@/components/ui/icons'

const LINKS = [
  { to: '/', label: 'Product', exact: true },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/auditor', label: 'Auditor' },
  { to: '/docs', label: 'Docs' },
]

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md border border-accent/25 bg-accent/10">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent" fill="currentColor" aria-hidden>
          <circle cx="6" cy="10" r="1.6" />
          <circle cx="12" cy="7" r="1.6" />
          <circle cx="18" cy="10" r="1.6" />
          <path d="M4 15c2 3 4.5 4.5 8 4.5S18 18 20 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-sm font-semibold tracking-tight text-ink">Meerkat</span>
    </Link>
  )
}

export function MarketingShell({
  session,
  children,
}: {
  session: AppSession | null
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
          <Wordmark />

          <nav className="hidden items-center gap-1 md:flex" aria-label="Marketing">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                activeOptions={{ exact: link.exact }}
                className="rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink"
                activeProps={{ className: 'text-ink' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Signed-in visitors get the account menu; the repo link would sit
                flush against it and read as a dead control. */}
            {!session && (
              <a
                href="https://github.com/farhank15/meerkat"
                target="_blank"
                rel="noreferrer"
                className="hidden text-ink-subtle transition-colors hover:text-ink sm:block"
                aria-label="Meerkat on GitHub"
              >
                <GithubIcon width={16} height={16} />
              </a>
            )}
            {session ? (
              <AccountMenu session={session} />
            ) : (
              <>
                <Link to="/login" className="text-xs font-medium text-ink-muted transition-colors hover:text-ink">
                  Sign in
                </Link>
                <Link to="/login" search={{ mode: 'register' }}>
                  <Button variant="primary" size="sm">
                    Start free
                  </Button>
                </Link>
              </>
            )}
            <button
              type="button"
              className="ml-1 text-ink-muted md:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-line px-5 py-3 md:hidden" aria-label="Marketing mobile">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="block rounded-md px-2 py-2 text-sm text-ink-muted hover:bg-surface-hover hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Wordmark />
            <span className="text-2xs text-ink-subtle">
              Know whether your green suite catches anything.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-2xs text-ink-subtle">
            <Link to="/how-it-works" className="hover:text-ink-muted">
              How it works
            </Link>
            <Link to="/docs" className="hover:text-ink-muted">
              Docs
            </Link>
            <a
              href="https://testsprite.com"
              target="_blank"
              rel="noreferrer"
              className={cn('hover:text-ink-muted')}
            >
              TestSprite
            </a>
            <span>© 2026 Meerkat</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
