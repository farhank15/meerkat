// Legacy path: older OAuth callbacks and bookmarks pointed at /app, which never
// existed as a route (the app shell is a pathless `_app` layout). Redirect it to
// the console home instead of showing a 404.

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/app')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})
