import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// Minimal config so vite-node can resolve the `@/*` and `#/*` aliases used by
// src/lib/store.ts when the seed script imports it. Kept separate from the app
// config so the Nitro/TanStack plugins never load in a plain-node context.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../src', import.meta.url)),
      '#': fileURLToPath(new URL('../src', import.meta.url)),
    },
  },
})
