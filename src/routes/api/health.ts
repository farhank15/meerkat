// GET /api/health → {"status":"ok"} — the contract asserted by SV-SMK-02.

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: () => Response.json({ status: 'ok' }),
    },
  },
})
