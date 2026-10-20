// Layout for /share/$slug. Validates the slug against PUBLIC projects once,
// then renders the scorecard or a run inside a minimal public header.

import { Link, Outlet, createFileRoute, notFound } from '@tanstack/react-router'

import { Badge } from '@/components/ui/primitives'
import { getPublicProjectFn } from '@/server/public'

export const Route = createFileRoute('/share/$slug')({
  beforeLoad: async ({ params }) => {
    const project = await getPublicProjectFn({ data: { slug: params.slug } })
    if (!project) throw notFound()
    return { project }
  },
  component: ShareLayout,
})

function ShareLayout() {
  const { project } = Route.useRouteContext()

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5">
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
          <div className="flex items-center gap-3">
            <Badge tone="neutral">Public scorecard</Badge>
            <Link to="/login" className="text-2xs font-medium text-ink-muted hover:text-ink">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line px-5 py-4 text-center text-2xs text-ink-subtle">
        {project.name} · read-only · scored by Meerkat
      </footer>
    </div>
  )
}
