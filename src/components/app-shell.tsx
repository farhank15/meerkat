// Authenticated application shell: fixed sidebar, workspace identity, and the
// only sign-out affordance. Marketing chrome never appears here.

import { useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'

import { cn } from '@/lib/cn'
import type { AppSession } from '@/server/session'
import { Avatar, Badge, IconButton } from '@/components/ui/primitives'
import {
  ActivityIcon,
  BookIcon,
  CloseIcon,
  FolderIcon,
  GridIcon,
  KeyIcon,
  LogoutIcon,
  MenuIcon,
  PlugIcon,
  SettingsIcon,
  TerminalIcon,
} from '@/components/ui/icons'

interface NavItem {
  to: string
  label: string
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement
  exact?: boolean
}

const PRIMARY: NavItem[] = [
  { to: '/dashboard', label: 'Overview', icon: GridIcon, exact: true },
  { to: '/runs', label: 'Runs', icon: ActivityIcon },
  { to: '/projects', label: 'Projects', icon: FolderIcon },
]

const CONNECT: NavItem[] = [
  { to: '/integrations', label: 'Integrations', icon: PlugIcon },
  { to: '/api-keys', label: 'API keys', icon: KeyIcon },
  { to: '/mcp', label: 'MCP & CLI', icon: TerminalIcon },
]

const ACCOUNT: NavItem[] = [
  { to: '/docs', label: 'Docs', icon: BookIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const active = item.exact ? pathname === item.to : pathname.startsWith(item.to)
  const Icon = item.icon

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-surface-hover text-ink'
          : 'text-ink-subtle hover:bg-surface-hover/60 hover:text-ink-muted',
      )}
    >
      <Icon width={15} height={15} className={active ? 'text-accent' : undefined} />
      {item.label}
    </Link>
  )
}

function SidebarContent({ session, onNavigate }: { session: AppSession; onNavigate?: () => void }) {
  const navigate = useNavigate()
  const displayName = session.user.name ?? session.user.email

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    navigate({ to: '/login' })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-line px-3">
        <Link to="/dashboard" onClick={onNavigate} className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-accent/25 bg-accent/10">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent" fill="currentColor" aria-hidden>
              <circle cx="6" cy="10" r="1.6" />
              <circle cx="12" cy="7" r="1.6" />
              <circle cx="18" cy="10" r="1.6" />
              <path d="M4 15c2 3 4.5 4.5 8 4.5S18 18 20 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className="truncate text-sm font-semibold tracking-tight text-ink">Meerkat</span>
        </Link>
      </div>

      <div className="border-b border-line px-3 py-2.5">
        <div className="text-2xs uppercase tracking-wider text-ink-subtle">Workspace</div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-xs font-medium text-ink">{session.workspace.name}</span>
          {!session.workspace.onboarded && <Badge tone="warn">Setup</Badge>}
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-3" aria-label="Application">
        <NavGroup items={PRIMARY} onNavigate={onNavigate} />
        <NavGroup label="Connect" items={CONNECT} onNavigate={onNavigate} />
        <NavGroup label="Workspace" items={ACCOUNT} onNavigate={onNavigate} />
      </nav>

      <div className="border-t border-line p-2">
        <div className="flex items-center gap-2 rounded-md px-1.5 py-1.5">
          <Avatar name={displayName} src={session.user.avatarUrl} size={26} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-2xs font-medium text-ink">{displayName}</div>
            <div className="truncate text-2xs text-ink-subtle">{session.user.email}</div>
          </div>
          <IconButton label="Sign out" onClick={signOut}>
            <LogoutIcon width={14} height={14} />
          </IconButton>
        </div>
      </div>
    </div>
  )
}

function NavGroup({
  label,
  items,
  onNavigate,
}: {
  label?: string
  items: NavItem[]
  onNavigate?: () => void
}) {
  return (
    <div>
      {label && (
        <div className="mb-1 px-2.5 text-2xs font-medium uppercase tracking-wider text-ink-subtle/70">
          {label}
        </div>
      )}
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  )
}

export function AppShell({ session, children }: { session: AppSession; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-line bg-surface lg:block">
        <SidebarContent session={session} />
      </aside>

      {/* Mobile: top bar + overlay sidebar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-12 items-center gap-2 border-b border-line bg-surface px-3 lg:hidden">
        <IconButton label="Open navigation" onClick={() => setMobileOpen(true)}>
          <MenuIcon />
        </IconButton>
        <span className="text-sm font-semibold text-ink">Meerkat</span>
        <span className="ml-auto truncate text-2xs text-ink-subtle">{session.workspace.name}</span>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-line bg-surface">
            <div className="absolute right-2 top-2">
              <IconButton label="Close navigation" onClick={() => setMobileOpen(false)}>
                <CloseIcon />
              </IconButton>
            </div>
            <SidebarContent session={session} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1 pt-12 lg:ml-60 lg:pt-0">{children}</div>
    </div>
  )
}
