#!/usr/bin/env vite-node
// `suitevitals score` — companion CLI. Scores a TestSprite JUnit result against a
// SPEC.md contract. Deterministic: same input → byte-identical output.
//   node src/lib/cli/score.ts --junit testsprite-junit.xml --spec SPEC.md
// Exit codes: 0 ok · 2 missing argument · 3 missing file · 1 parse/other error.

import { readFileSync } from 'node:fs'
import { scoreFromArtifacts } from '../scoreCmd'

function fail(code: number, message: string): never {
  process.stderr.write(`suitevitals: ${message}\n`)
  process.exit(code)
}

function parseArgs(argv: string[]): { junit?: string; spec?: string } {
  const out: { junit?: string; spec?: string } = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--junit' || a === '-j') out.junit = argv[++i]
    else if (a === '--spec' || a === '-s') out.spec = argv[++i]
  }
  return out
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.junit || !args.spec) {
    fail(2, 'missing argument — required: --junit <file> --spec <file>')
  }

  let junitXml: string
  let specText: string
  try {
    junitXml = readFileSync(args.junit, 'utf8')
  } catch {
    fail(3, `missing file: ${args.junit}`)
  }
  try {
    specText = readFileSync(args.spec, 'utf8')
  } catch {
    fail(3, `missing file: ${args.spec}`)
  }

  try {
    const result = scoreFromArtifacts(junitXml, specText)
    process.stdout.write(JSON.stringify(result, null, 2) + '\n')
    process.exit(0)
  } catch {
    fail(1, 'could not score artifacts (invalid JUnit XML or SPEC)')
  }
}

main()
