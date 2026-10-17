import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { setSession } from '@/lib/session'

const loginFn = createServerFn({ method: 'POST' })
  .validator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    // matcha: demo-only auth — verifies the seeded account, no real session store.
    const ok =
      data.email === 'demo@suitevitals.dev' && data.password === 'demo-password-1'
    return { ok }
  })

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  const navigate = useNavigate()
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-500/10 via-neutral-900 to-neutral-950 p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl"
        />
        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-400/30">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-400" fill="currentColor">
              <circle cx="6" cy="10" r="1.6" />
              <circle cx="12" cy="7" r="1.6" />
              <circle cx="18" cy="10" r="1.6" />
              <path d="M4 15c2 3 4.5 4.5 8 4.5S18 18 20 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-neutral-100">
            Meerkat
          </span>
        </Link>
        <div className="relative">
          <p className="text-2xl font-semibold leading-snug tracking-tight text-neutral-100">
            Know whether your green suite actually catches anything.
          </p>
          <p className="mt-4 max-w-sm text-sm text-neutral-400">
            Sign in to explore the demo dashboard, built from a real TestSprite run
            scored by the Test Strength Index.
          </p>
        </div>
        <p className="relative text-xs text-neutral-600">
          © 2026 Meerkat · TestSprite Hackathon Season 4
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-8">
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const res = await loginFn({
              data: {
                email: String(fd.get('email') ?? ''),
                password: String(fd.get('password') ?? ''),
              },
            })
            if (res.ok) {
              setSession()
              navigate({ to: '/runs' })
            } else {
              alert('Invalid credentials')
            }
          }}
          className="w-full max-w-sm"
        >
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              Sign in to your workspace to continue.
            </p>
          </div>

          <label className="block text-sm font-medium text-neutral-300">
            Email
            <input
              name="email"
              type="email"
              autoComplete="username"
              defaultValue="demo@suitevitals.dev"
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-900 px-3.5 py-2.5 text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-neutral-300">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              defaultValue="demo-password-1"
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-900 px-3.5 py-2.5 text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10"
            />
          </label>

          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-neutral-950 transition-colors hover:bg-emerald-500"
          >
            Sign in
          </button>

          <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-3 text-xs text-neutral-500">
            <span className="font-medium text-neutral-400">Demo account</span> ·{' '}
            <span className="font-mono text-neutral-400">demo@suitevitals.dev</span> /{' '}
            <span className="font-mono text-neutral-400">demo-password-1</span>
          </div>
        </form>
      </div>
    </div>
  )
}
