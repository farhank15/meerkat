#!/usr/bin/env node
// Guard: the design system is the only source of colour and shape.
//
// Two kinds of drift are cheap to reintroduce and expensive to unwind:
//   1. Raw colour literals in components — they bypass the `@theme` tokens in
//      src/styles.css, so a palette change silently leaves pages behind.
//   2. Imports of the pre-refactor shells (site.tsx, magicui.tsx, AuthGate…)
//      which render an older navigation and an unfiltered data view.
//
// The badge endpoint is exempt: it emits a shields.io-style SVG where the
// colours are part of the image contract, not the app's theme.

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'src')
const EXTENSIONS = new Set(['.ts', '.tsx'])

/** SVG badges are images, not UI surfaces. */
const COLOR_EXEMPT = [path.join(SRC, 'routes', 'api', 'badge')]

/** Modules deleted in the tenancy refactor — nothing may import them again. */
const REMOVED_MODULES = [
  '@/components/site',
  '@/components/magicui',
  '@/components/AuthGate',
  '@/components/RunDetailView',
  '@/components/CoverageTrace',
  '@/components/ShareNotFound',
  '@/lib/live-run',
  '@/lib/session',
]

const HEX_COLOR_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g
const IMPORT_RE = /from\s+['"]([^'"]+)['"]/g

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

function lineOf(source, index) {
  return source.slice(0, index).split('\n').length
}

const violations = []
let scanned = 0

for await (const file of walk(SRC)) {
  scanned += 1
  const relative = path.relative(ROOT, file)
  const source = await readFile(file, 'utf8')

  const colorExempt = COLOR_EXEMPT.some((prefix) => file.startsWith(prefix))
  if (!colorExempt) {
    for (const match of source.matchAll(HEX_COLOR_RE)) {
      violations.push(
        `${relative}:${lineOf(source, match.index)} raw colour ${match[0]} — use a @theme token`,
      )
    }
  }

  for (const match of source.matchAll(IMPORT_RE)) {
    const specifier = match[1]
    if (!REMOVED_MODULES.includes(specifier)) continue
    violations.push(
      `${relative}:${lineOf(source, match.index)} imports removed module '${specifier}'`,
    )
  }
}

if (violations.length > 0) {
  console.error('check-ui-drift: design-system drift detected\n')
  for (const violation of violations) console.error(`  ✗ ${violation}`)
  console.error(
    '\nColours live in the @theme block of src/styles.css. Navigation lives in\n' +
      'src/components/app-shell.tsx and src/components/marketing-shell.tsx.',
  )
  process.exit(1)
}

console.log(`check-ui-drift: ok (${scanned} files, tokens only)`)
