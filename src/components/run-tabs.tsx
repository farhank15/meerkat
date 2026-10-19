import { Link, useRouterState } from '@tanstack/react-router'

import { cn } from '@/lib/cn'

export function RunTabs({ id }: { id: string }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  const tabs = [
    { to: '/runs/$id', params: { id }, label: 'Overview', match: `/runs/${id}` },
    { to: '/runs/$id/coverage', params: { id }, label: 'Coverage', match: `/runs/${id}/coverage` },
    { to: '/runs/$id/audit', params: { id }, label: 'Audit', match: `/runs/${id}/audit` },
  ]

  return (
    <nav aria-label="Run sections" className="flex items-center gap-1 border-b border-line px-6">
      {tabs.map((tab) => {
        const active = pathname === tab.match
        return (
          <Link
            key={tab.label}
            to={tab.to}
            params={tab.params}
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
