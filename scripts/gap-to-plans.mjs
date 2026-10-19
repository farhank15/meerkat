#!/usr/bin/env node
/**
 * gap-to-plans.mjs — the reverse loop: SPEC coverage gaps → new test plans.
 *
 * The dashboard traces SPEC.md scenario IDs to runnable tests by ID-in-name
 * matching. Every ID that no fixture test anchors is an honest coverage gap;
 * this script turns each gap into a ready-to-file TestSprite test plan JSON
 * (schema: planSteps[] with type "action" | "assertion") so the next create
 * step can turn untested scenarios into real runs — the exact flow that gave
 * birth to the two newest portal tests.
 *
 *   node scripts/gap-to-plans.mjs --project <testsprite-project-id> [--out plans-out]
 *
 * Read-only inputs: SPEC.md + src/lib/fixtures/testsprite-junit.xml (same
 * deterministic ID-in-name rule as the engine); no portal calls, no credits.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'

const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 ? process.argv[i + 1] : fallback
}
const PID = arg('project', process.env.TESTSPRITE_PROJECT_ID)
const outDir = arg('out', 'plans-out')
if (!PID) {
  console.error('TESTSPRITE_PROJECT_ID required (--project <id> or env)')
  process.exit(2)
}

// ── 1. SPEC.md: all scenario IDs with their human description ───────────────
const specText = await readFile(new URL('../SPEC.md', import.meta.url), 'utf8')
const specEntries = []
{
  let lineNo = 0
  const seen = new Set()
  for (const line of specText.split('\n')) {
    lineNo += 1
    const m = line.match(/SV-[A-Z]{3}-\d{2}/)
    if (!m || seen.has(m[0])) continue
    seen.add(m[0])
    specEntries.push({
      id: m[0],
      specLine: lineNo,
      text: line
        .replace(/^[\s*>#-]+/, '')
        .replace(/\|/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 220), // keep one-step copy readable inside the plan JSON
    })
  }
}

// ── 2. fixture artifact: which IDs are already anchored by test names ───────
const junitXml = await readFile(
  new URL('../src/lib/fixtures/testsprite-junit.xml', import.meta.url),
  'utf8',
)
const allNames = [...junitXml.matchAll(/<testcase\b[^>]*?\bname="([^"]*)"/g)].map((m) => m[1])
const claimed = new Set(
  allNames.map((n) => n.match(/SV-[A-Z]{3}-\d{2}/)?.[0]).filter(Boolean),
)

const gaps = specEntries.filter((e) => !claimed.has(e.id))
console.log(`SPEC ids: ${specEntries.length} · covered: ${specEntries.length - gaps.length} · gaps: ${gaps.length}`)

// ── 3. emit one plan JSON per gap ───────────────────────────────────────────
await mkdir(outDir, { recursive: true })
for (const gap of gaps) {
  const plan = {
    projectId: PID,
    name: `${gap.id} ${gap.text.slice(0, 80)}`,
    priority: 'high',
    planSteps: [
      {
        type: 'action',
        description: `Open the Meerkat surface that realizes spec scenario ${gap.id}: ${gap.text}`,
      },
      {
        type: 'assertion',
        description: `Assert the observable outcome described by ${gap.id}, anchored on visible page evidence (SPEC.md line ${gap.specLine}).`,
      },
    ],
  }
  const file = `${outDir}/${gap.id.replace(/SV-([A-Z]{3})-(\d{2})/, '$1-$2').toLowerCase()}.json`
  await writeFile(file, `${JSON.stringify(plan, null, 2)}\n`)
}
console.log(`wrote ${gaps.length} plan json file(s) to ${outDir}/`)
console.log('next: file these plans through the TestSprite create flow (same schema as planSteps[])')
