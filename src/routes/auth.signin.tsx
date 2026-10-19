import { createFileRoute, redirect } from '@tanstack/react-router'

// TestSprite's explorer detected `/auth/signin` as the login page from the old
// scaffold. Our app's real login lives at `/login`, so we redirect here to keep
// the previously-learned path working for the testing agent.
export const Route = createFileRoute('/auth/signin')({
  beforeLoad: () => {
    throw redirect({ to: '/login' })
  },
})
