#!/usr/bin/env node
// Guard: the committed demo fixture is test-only.
//
// `src/lib/store.ts` holds the SV-TSI-01 baseline derived from SPEC.md +
// testsprite-junit.xml. It exists so the engine suite has a deterministic
// oracle. Product code must read the database instead — importing DEMO_RUN
// into a route is how the old build showed every account the same data.
//
// Allowed: `import type { Run } from '@/lib/store'` (types carry no data).
// Denied:  any value import from `@/lib/store` outside tests + store itself.

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'src')
const STORE = path.join(SRC, 'lib', 'store.ts')
const EXTENSIONS = new Set(['.ts', '.tsx'])

/** Import specifiers that resolve to the fixture store. */
const STORE_SPECIFIERS = new Set(['@/lib/store', './store', '../store', '../lib/store'])

/** Skip files whose job is to hold or exercise the fixture. */
function isExempt(file) {
  if (file === STORE) return true
  return /\.test\.(ts|tsx)$/.test(file)
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(full)
      continue
    }
    if (EXTENSIONS.has(path.extname(entry.name))) yield full
  }
}

/** Matches `import <clause> from '<specifier>'` on a single logical line. */
const IMPORT_RE = /^\s*import\s+(type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/gm

const violations = []
let scanned = 0

for await (const file of walk(SRC)) {
  if (isExempt(file)) continue
  scanned += 1

  const source = await readFile(file, 'utf8')
  const relative = path.relative(ROOT, file)

  for (const match of source.matchAll(IMPORT_RE)) {
    const [, typeOnly, clause, specifier] = match
    if (!STORE_SPECIFIERS.has(specifier)) continue
    if (typeOnly) continue

    // A clause made only of `type X` specifiers still carries no runtime value.
    const bindings = clause
      .replace(/[{}]/g, ' ')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
    const allTypeBindings = bindings.length > 0 && bindings.every((part) => /^type\s/.test(part))
    if (allTypeBindings) continue

    const line = source.slice(0, match.index).split('\n').length
    violations.push(`${relative}:${line} imports ${bindings.join(', ') || 'default'} from '${specifier}'`)
  }
}

if (violations.length > 0) {
  console.error('check-fixture-imports: product code imports the demo fixture\n')
  for (const violation of violations) console.error(`  ✗ ${violation}`)
  console.error(
    '\nThe fixture is a test oracle. Read runs/projects through src/server/*.ts,\n' +
      'which scope every query to the signed-in workspace.',
  )
  process.exit(1)
}

console.log(`check-fixture-imports: ok (${scanned} files, no fixture value imports)`)
