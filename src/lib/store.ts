// Seeded in-memory demo store. Holds the demo project + the headline TSI-93
// fixture (SV-TSI-01) so the dashboard and TestSprite have real data to render.
// Real persistence (Neon/Drizzle) is a follow-up; this is the reliable MVP layer.
// matcha: demo-only seed — no live database required to run/test the app.

import { tsiFromCounts } from '@/lib/tsi'
import type { RunCounts } from '@/lib/types'
import { parseJUnit, type JUnitStatus } from '@/lib/junit'
import junitXml from './fixtures/testsprite-junit.xml?raw'

export interface SpecEntry {
  id: string
  covered: boolean
  /** Testcase that asserts this ID, or null when the ID is a gap. */
  testName: string | null
  /** Verdict of the testcase that covers this ID (absent for gaps). */
  status?: JUnitStatus
  /** Why the testcase failed, straight from the JUnit artifact. */
  failureMessage?: string
  /** Passed without asserting anything — excluded from the pass rate. */
  vacuous?: boolean
}

export interface RunMetric {
  tsi: number
  coverage: number
  stability: number
  passRate: number
}

export interface LoopAction {
  pr: string
  classification: string
  action: string
  result: string
  fixCommit?: string
}

/** One row of the JUnit artifact, as the run detail renders it. */
export interface TestCaseRow {
  name: string
  /** SPEC ID asserted by this testcase, or null when the test is an orphan. */
  specId: string | null
  status: JUnitStatus
  message?: string
  vacuous?: boolean
}

export interface Run {
  id: string
  projectId: string
  sha: string
  pr: string
  branch: string
  environment: string
  resolvedUrl: string
  context: string
  total: number
  passed: number
  failed: number
  skipped: number
  meaningfulPasses: number
  vacuousCount: number
  conflicted: number
  tested: number
  coverageIdsTotal: number
  coverageIdsCovered: number
  metric: RunMetric
  status: string
  createdAt: string
  specEntries: SpecEntry[]
  /** Every testcase in the artifact, including orphans. */
  testCases: TestCaseRow[]
  loop?: LoopAction
}

export interface Project {
  id: string
  name: string
  slug: string
  shared: boolean
  repoUrl: string
}

export interface User {
  email: string
  password: string
}

export const DEMO_USER: User = {
  email: 'demo@suitevitals.dev',
  password: 'demo-password-1',
}

export const DEMO_PROJECT: Project = {
  id: 'p1',
  name: 'Meerkat (demo)',
  slug: 'meerkat-demo',
  shared: true,
  repoUrl: 'https://github.com/farhank15/meerkat',
}

export const DEMO_BASELINE = 93

// SV-TSI-01 fixture: 60/67 coverage, 66/67 stability, 63/67 meaningful → TSI 93.
// The run is built from the committed JUnit artifact, not from a hand-written
// loop, so every status the dashboard shows can be traced to a <testcase>.

/** The artifact every demo number comes from. */
const DEMO_JUNIT = parseJUnit(junitXml)

/** 67 SPEC IDs. IDs 61-67 have no testcase — they are the gaps. */
const SPEC_IDS = [
  'SV-SMK-01',
  ...Array.from({ length: 66 }, (_, i) => `SV-XX-${String(i + 2).padStart(2, '0')}`),
]

/** One green test that asserted nothing — the vacuous pass the score excludes. */
const VACUOUS_TEST = 'SV-XX-33 demo'

function buildSpecEntries(): SpecEntry[] {
  return SPEC_IDS.map((id) => {
    const tc = DEMO_JUNIT.cases.find((c) => c.name.includes(id))
    if (!tc) return { id, covered: false, testName: null }
    return {
      id,
      covered: true,
      testName: tc.name,
      status: tc.status,
      failureMessage: tc.message,
      vacuous: tc.name === VACUOUS_TEST,
    }
  })
}

function buildDemoRun(): Run {
  const specEntries = buildSpecEntries()
  const coveredIds = specEntries.filter((s) => s.covered).length
  const vacuousCount = specEntries.filter((s) => s.vacuous).length
  const meaningfulPasses = DEMO_JUNIT.passed - vacuousCount

  const testCases: TestCaseRow[] = DEMO_JUNIT.cases.map((c) => ({
    name: c.name,
    specId: SPEC_IDS.find((id) => c.name.includes(id)) ?? null,
    status: c.status,
    message: c.message,
    vacuous: c.name === VACUOUS_TEST,
  }))

  const counts: RunCounts = {
    coveredIds,
    totalIds: specEntries.length,
    conflicted: 1,
    tested: DEMO_JUNIT.total,
    meaningfulPasses,
    totalTests: DEMO_JUNIT.total,
  }

  const tsi = tsiFromCounts(counts)

  return {
    id: 'run-demo-1',
    projectId: DEMO_PROJECT.id,
    // Real commit on the public repo — the traceability link must resolve.
    sha: 'c70caa4b2bc872fe1e9d2c9ec2f7d66b9b980c01',
    pr: '#12',
    branch: 'main',
    environment: 'preview',
    resolvedUrl: 'https://meerkat-git-pr-12-team.vercel.app',
    context: 'desktop-auth',
    total: DEMO_JUNIT.total,
    passed: DEMO_JUNIT.passed,
    failed: DEMO_JUNIT.failed,
    skipped: DEMO_JUNIT.skipped,
    meaningfulPasses,
    vacuousCount,
    conflicted: 1,
    tested: DEMO_JUNIT.total,
    coverageIdsTotal: specEntries.length,
    coverageIdsCovered: coveredIds,
    metric: {
      tsi,
      coverage: coveredIds / specEntries.length,
      stability: 1 - 1 / DEMO_JUNIT.total,
      passRate: meaningfulPasses / DEMO_JUNIT.total,
    },
    status: 'complete',
    createdAt: '2026-10-16T10:00:00Z',
    specEntries,
    testCases,
    loop: {
      pr: '#12',
      classification: 'regression',
      action: 'fix proposed',
      result: 'green',
      fixCommit: '1a84fd8410a6ed0fca3592c0fe948ced0b631c94',
    },
  }
}

export const DEMO_RUN: Run = buildDemoRun()

export function authenticate(email: string, password: string): boolean {
  // matcha: demo-only auth — real auth persists a session for the seeded account.
  return email === DEMO_USER.email && password === DEMO_USER.password
}

export function getProjectBySlug(slug: string): Project | undefined {
  return slug === DEMO_PROJECT.slug ? DEMO_PROJECT : undefined
}

export function getProject(id: string): Project | undefined {
  return id === DEMO_PROJECT.id ? DEMO_PROJECT : undefined
}

export function getRun(id: string): Run | undefined {
  return id === DEMO_RUN.id ? DEMO_RUN : undefined
}

export function listRuns(projectId: string): Run[] {
  return projectId === DEMO_PROJECT.id ? [DEMO_RUN] : []
}

export function getLoop(projectId: string): LoopAction[] {
  return projectId === DEMO_PROJECT.id && DEMO_RUN.loop ? [DEMO_RUN.loop] : []
}
