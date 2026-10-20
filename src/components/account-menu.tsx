// Account affordance for the public marketing header. A signed-in visitor must
// never be asked to "Sign in" again, so the header swaps the auth CTAs for the
// avatar and a small menu into the console.

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'

import { cn } from '@/lib/cn'
import type { AppSession } from '@/server/session'
import { Avatar } from '@/components/ui/primitives'
import {
  ChevronDownIcon,
  FolderIcon,
  GridIcon,
  KeyIcon,
  LogoutIcon,
  SettingsIcon,
} from '@/components/ui/icons'

const ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: GridIcon },
  { to: '/projects', label: 'Projects', icon: FolderIcon },
  { to: '/api-keys', label: 'API keys', icon: KeyIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
] as const

export function AccountMenu({ session }: { session: AppSession }) {
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const router = useRouter()

  const displayName = session.user.name ?? session.user.email

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (container.current && !container.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function signOut() {
    setOpen(false)
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    await router.invalidate()
    navigate({ to: '/' })
  }

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1 rounded-full p-0.5 transition-colors hover:bg-surface-hover"
      >
        <Avatar name={displayName} src={session.user.avatarUrl} size={28} />
        <ChevronDownIcon width={12} height={12} className="mr-1 text-ink-subtle" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-lg border border-line bg-surface shadow-pop"
        >
          <div className="border-b border-line px-3 py-2.5">
            <div className="truncate text-xs font-medium text-ink">{displayName}</div>
            <div className="truncate text-2xs text-ink-subtle">{session.user.email}</div>
            <div className="mt-1 flex items-center gap-1.5 text-2xs text-ink-subtle">
              <span className="truncate">{session.workspace.name}</span>
              {!session.workspace.onboarded && (
                <span className="shrink-0 rounded-full border border-warn/25 bg-warn/10 px-1.5 text-warn">
                  Setup
                </span>
              )}
            </div>
          </div>

          <div className="p-1">
            {ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-ink-muted',
                    'transition-colors hover:bg-surface-hover hover:text-ink',
                  )}
                >
                  <Icon width={14} height={14} className="text-ink-subtle" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          <div className="border-t border-line p-1">
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <LogoutIcon width={14} height={14} className="text-ink-subtle" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
