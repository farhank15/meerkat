import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const src = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  // Same `@/` alias the app uses, so tests import the store and the engine
  // through the same specifiers as production code.
  resolve: { alias: { '@': src, '#': src } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
