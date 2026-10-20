// Page-level layout: header, breadcrumbs, tabs. Keeps every screen on the same
// vertical rhythm instead of each route inventing its own.

import type { ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'

import { cn } from '@/lib/cn'

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  breadcrumbs?: Array<{ label: string; to?: string; params?: Record<string, string> }>
}) {
  return (
    <header className="border-b border-line bg-canvas/60 px-6 py-5">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-2xs text-ink-subtle">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && <span aria-hidden>/</span>}
              {crumb.to ? (
                <Link to={crumb.to} params={crumb.params} className="transition-colors hover:text-ink">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-ink-muted">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
          {description && (
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-muted">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}

export function TabNav({
  tabs,
}: {
  tabs: Array<{ to: string; label: string; exact?: boolean }>
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <nav aria-label="Section" className="flex items-center gap-1 border-b border-line px-6">
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to)
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              '-mb-px border-b-2 px-3 py-2.5 text-xs font-medium transition-colors',
              active
                ? 'border-accent text-ink'
                : 'border-transparent text-ink-subtle hover:border-line-strong hover:text-ink-muted',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">{children}</h2>
      {action}
    </div>
  )
}
