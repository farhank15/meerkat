// Baseline evidence store. Holds this repository's committed headline fixture —
// derived verbatim from SPEC.md + testsprite-junit.xml (SV-TSI-01, TSI 93) — so
// the dashboard always renders deterministic, shipped evidence.
// Persistence is real (Neon/Drizzle via /api/runs ingest + auth): live ingested
// runs render in their own labelled section and never blend into this fixture.
// matcha: fixture stays as labelled baseline — suite + badge fallback depend on it.

import { tsiFromCounts } from '@/lib/tsi'
import type { RunCounts } from '@/lib/types'
import { parseJUnit, type JUnitStatus } from '@/lib/junit'
import { parseSpec, type SpecScenario } from '@/lib/spec'
import junitXml from './fixtures/testsprite-junit.xml?raw'
import specMarkdown from '../../SPEC.md?raw'

export interface SpecEntry {
  id: string
  /** 1-based line in SPEC.md that defines this scenario — the gap trace target. */
  specLine: number
  covered: boolean
  /** The scenario row's own text — the in-page proof that the line exists. */
  asserts?: string
  /** Testcase that asserts this ID, or null when the ID is a gap. */
  testName: string | null
  /** Verdict of the testcase that covers this ID (absent for gaps). */
  status?: JUnitStatus
  /** Why the testcase failed, straight from the JUnit artifact. */
  failureMessage?: string
  /** Passed without asserting anything — excluded from the pass rate. */
  vacuous?: boolean
  /** Passed with exactly one assertion step — flagged, pass rate unchanged. */
  shallow?: boolean
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

/** A fix attempt that failed and was escalated rather than force-greened.
 * Realised by SV-FIX-06: after `maxAttempts` red reruns the loop stops and a
 * human takes over — Meerkat never retries more than once. */
export interface Escalation {
  specId: string
  attempts: number
  maxAttempts: number
  /** The rerun state when the attempt failed. */
  rerun: 'red' | 'green'
  result: 'escalated'
}

/**
 * What the run is allowed to claim. A refused or incomplete run is not a
 * failure — it means the evidence is not there yet, so the score is withheld.
 */
export interface Verdict {
  state: 'green' | 'failed' | 'incomplete' | 'refused'
  label: string
  detail: string
  /** Requested / completed / refused counts, for an incomplete rerun. */
  requested?: number
  completed?: number
  refused?: number
}

/** One row of the JUnit artifact, as the run detail renders it. */
export interface TestCaseRow {
  name: string
  /** SPEC ID asserted by this testcase, or null when the test is an orphan. */
  specId: string | null
  status: JUnitStatus
  message?: string
  vacuous?: boolean
  /** Exactly one assertion step — flagged to the reader, pass rate unchanged. */
  shallow?: boolean
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
  verdict?: Verdict
  loop?: LoopAction
  /** Failed fix attempts that were escalated to a human instead of forced green. */
  escalations?: Escalation[]
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

// The demo run is derived from two committed artifacts — SPEC.md (the contract)
// and testsprite-junit.xml (what actually ran). Nothing is hard-coded, so every
// score traces back to a scenario line and a testcase row.
//
// 33 SPEC IDs (30 covered, 3 gaps) + 37 orphan testcases = 67 testcases;
// 64 passed / 3 failed / 1 vacuous / 2 conflicted → TSI 93.

const SPEC: SpecScenario[] = parseSpec(specMarkdown)

/** The artifact every demo number comes from. */
const DEMO_JUNIT = parseJUnit(junitXml)

/** One green test that asserted nothing — the vacuous pass the score excludes. */
const VACUOUS_TEST = 'View the public scorecard'

/** One green test with exactly one assertion step — flagged `shallow (1
 * assertion)`, a signal shown to the reader, not a penalty: the pass rate
 * keeps counting it, exactly as SPEC.md line 83 promises. */
const SHALLOW_TEST = 'Open a public share page by slug'

/** Two runs of the same SHA disagreed — the stability penalty. */
const CONFLICTED = 2

function specIdFor(testName: string): string | null {
  return SPEC.find((s) => testName.includes(s.id))?.id ?? null
}

function buildSpecEntries(): SpecEntry[] {
  return SPEC.map((s) => {
    const tc = DEMO_JUNIT.cases.find((c) => c.name.includes(s.id))
    if (!tc) return { id: s.id, specLine: s.line, covered: false, testName: null, asserts: s.asserts }
    return {
      id: s.id,
      specLine: s.line,
      covered: true,
      testName: tc.name,
      status: tc.status,
      failureMessage: tc.message,
      vacuous: tc.name === VACUOUS_TEST,
      shallow: tc.name === SHALLOW_TEST,
      asserts: s.asserts,
    }
  })
}

/** Every testcase in the artifact. `specId: null` means the test asserts no scenario. */
function buildTestCases(): TestCaseRow[] {
  return DEMO_JUNIT.cases.map((c) => ({
    name: c.name,
    specId: specIdFor(c.name),
    status: c.status,
    message: c.message,
    vacuous: c.name === VACUOUS_TEST,
    shallow: c.name === SHALLOW_TEST,
  }))
}

function buildDemoRun(): Run {
  const specEntries = buildSpecEntries()
  const testCases = buildTestCases()
  const coveredIds = specEntries.filter((s) => s.covered).length
  const vacuousCount = testCases.filter((t) => t.vacuous).length
  const meaningfulPasses = DEMO_JUNIT.passed - vacuousCount

  const counts: RunCounts = {
    coveredIds,
    totalIds: specEntries.length,
    conflicted: CONFLICTED,
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
    conflicted: CONFLICTED,
    tested: DEMO_JUNIT.total,
    coverageIdsTotal: specEntries.length,
    coverageIdsCovered: coveredIds,
    metric: {
      tsi,
      coverage: coveredIds / specEntries.length,
      stability: 1 - CONFLICTED / DEMO_JUNIT.total,
      passRate: meaningfulPasses / DEMO_JUNIT.total,
    },
    status: 'complete',
    createdAt: '2026-10-16T10:00:00Z',
    specEntries,
    testCases,
    verdict: {
      state: 'failed',
      label: 'failed — 3 testcases before remediation',
      detail:
        'The run failed on skip accounting (SV-ING-02), the coverage count (SV-COV-01) ' +
        'and the gap trace (SV-AUD-02). ' +
        'No score is trusted until the failing testcases are fixed or shown to be drift.',
    },
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

/**
 * A rerun where one of three requested testcases refused to execute. Two of
 * three finished, so the score is withheld instead of being reported as a drop.
 */
function buildIncompleteRun(): Run {
  const requested = ['SV-TSI-04', 'SV-ADQ-02', 'SV-DRF-01']
  const refused = 'SV-DRF-01'

  const testCases: TestCaseRow[] = requested.map((id) => {
    const scenario = SPEC.find((s) => s.id === id)
    const name = `${id} ${scenario?.asserts.replace(/`/g, '') ?? ''}`.trim()
    if (id === refused) {
      return {
        name,
        specId: id,
        status: 'skipped' as JUnitStatus,
        message: 'refused — the target deployment was replaced mid-run',
      }
    }
    return { name, specId: id, status: 'passed' as JUnitStatus }
  })

  const specEntries: SpecEntry[] = requested.map((id) => {
    const scenario = SPEC.find((s) => s.id === id)
    const tc = testCases.find((c) => c.specId === id)
    return {
      id,
      specLine: scenario?.line ?? 0,
      covered: tc?.status === 'passed',
      testName: tc?.name ?? null,
      status: tc?.status,
      failureMessage: tc?.message,
    }
  })

  const passed = testCases.filter((c) => c.status === 'passed').length
  const skipped = testCases.filter((c) => c.status === 'skipped').length

  return {
    id: 'run-demo-2',
    projectId: DEMO_PROJECT.id,
    sha: 'dd3d4acc9267a607bf7a1dab3d24c404c41140aa',
    pr: '#13',
    branch: 'feat/phase2-mvp',
    environment: 'preview',
    resolvedUrl: 'https://meerkat-git-feat-phase2-mvp-flaminextdevs-projects.vercel.app',
    context: 'desktop-auth',
    total: testCases.length,
    passed,
    failed: 0,
    skipped,
    meaningfulPasses: passed,
    vacuousCount: 0,
    conflicted: 0,
    tested: passed,
    coverageIdsTotal: requested.length,
    coverageIdsCovered: passed,
    // matcha: tsi 0 with status=incomplete — the UI renders "n/a", never 0.
    metric: { tsi: 0, coverage: passed / requested.length, stability: 1, passRate: 1 },
    status: 'incomplete',
    createdAt: '2026-10-18T09:12:00Z',
    specEntries,
    testCases,
    verdict: {
      state: 'incomplete',
      label: 'incomplete rerun refused',
      detail:
        'The rerun asked for 3 testcases; 2 finished and 1 refused because the ' +
        'preview URL changed underneath it. The check stays neutral and the score is withheld.',
      requested: 3,
      completed: 2,
      refused: 1,
    },
    loop: {
      pr: '#13',
      classification: 'spec-drift',
      action: 'test update needed',
      result: 'neutral',
    },
  }
}

export const DEMO_RUN_2: Run = buildIncompleteRun()

/** Tests that assert no SPEC scenario — they prove nothing about the contract. */
export function getOrphans(run: Run): TestCaseRow[] {
  return run.testCases.filter((t) => t.specId === null)
}

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

const ALL_RUNS: Run[] = [DEMO_RUN, DEMO_RUN_2]

export function getRun(id: string): Run | undefined {
  return ALL_RUNS.find((r) => r.id === id)
}

export function listRuns(projectId: string): Run[] {
  return projectId === DEMO_PROJECT.id ? ALL_RUNS : []
}

export function getLoop(projectId: string): LoopAction[] {
  if (projectId !== DEMO_PROJECT.id) return []
  return ALL_RUNS.flatMap((r) => (r.loop ? [r.loop] : []))
}
