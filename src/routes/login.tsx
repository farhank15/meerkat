import { createFileRoute, useNavigate } from '@tanstack/react-router'
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
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-8 text-neutral-100">
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
        className="w-full max-w-sm space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-8"
      >
        <h1 className="text-xl font-bold">Sign in</h1>
        <input
          name="email"
          type="email"
          defaultValue="demo@suitevitals.dev"
          autoComplete="username"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
        />
        <input
          name="password"
          type="password"
          defaultValue="demo-password-1"
          autoComplete="current-password"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500"
        >
          Sign in
        </button>
      </form>
    </div>
  )
}
