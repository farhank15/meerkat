// Seeded in-memory demo store. Holds the demo project + the headline TSI-93
// fixture (SV-TSI-01) so the dashboard and TestSprite have real data to render.
// Real persistence (Neon/Drizzle) is a follow-up; this is the reliable MVP layer.
// matcha: demo-only seed — no live database required to run/test the app.

import { tsiFromCounts } from '@/lib/tsi'
import type { RunCounts } from '@/lib/types'

export interface SpecEntry {
  id: string
  covered: boolean
  testName: string
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
  loop?: LoopAction
}

export interface Project {
  id: string
  name: string
  slug: string
  shared: boolean
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
}

export const DEMO_BASELINE = 93

// SV-TSI-01 fixture: 60/67 coverage, 66/67 stability, 63/67 meaningful → TSI 93.
function buildDemoRun(): Run {
  const specEntries: SpecEntry[] = []
  for (let i = 1; i <= 67; i++) {
    const covered = i <= 60
    if (i === 1) {
      specEntries.push({ id: 'SV-SMK-01', covered, testName: 'SV-SMK-01 landing' })
    } else {
      const id = `SV-XX-${String(i).padStart(2, '0')}`
      specEntries.push({
        id,
        covered,
        testName: covered ? `${id} demo` : `untested-${id}`,
      })
    }
  }

  const counts: RunCounts = {
    coveredIds: 60,
    totalIds: 67,
    conflicted: 1,
    tested: 67,
    meaningfulPasses: 63,
    totalTests: 67,
  }

  const tsi = tsiFromCounts(counts)

  return {
    id: 'run-demo-1',
    projectId: DEMO_PROJECT.id,
    sha: 'a1b2c3d4e5f6',
    pr: '#12',
    branch: 'main',
    environment: 'preview',
    resolvedUrl: 'https://meerkat-git-pr-12-team.vercel.app',
    context: 'desktop-auth',
    total: 67,
    passed: 64,
    failed: 3,
    skipped: 0,
    meaningfulPasses: 63,
    vacuousCount: 1,
    conflicted: 1,
    tested: 67,
    coverageIdsTotal: 67,
    coverageIdsCovered: 60,
    metric: {
      tsi,
      coverage: 60 / 67,
      stability: 66 / 67,
      passRate: 63 / 67,
    },
    status: 'complete',
    createdAt: '2026-10-16T10:00:00Z',
    specEntries,
    loop: {
      pr: '#12',
      classification: 'regression',
      action: 'fix proposed',
      result: 'green',
      fixCommit: 'fix(meerkat): correct rounding rule',
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
