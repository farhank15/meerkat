import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { Badge, Button, Card, CardContent, CardHeader } from '@/components/ui/primitives'
import { Field, Input } from '@/components/ui/form'
import { CodeBlock } from '@/components/ui/code'
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { createProjectFn } from '@/server/projects'
import { createKeyFn } from '@/server/keys'
import { completeOnboardingFn, updateWorkspaceFn } from '@/server/workspace'
import type { AppSession } from '@/server/session'

export const Route = createFileRoute('/_authed/onboarding/')({
  component: Onboarding,
})

const STEPS = ['Workspace', 'Project', 'API key', 'Workflow'] as const

function workflow(slug: string): string {
  return `name: Meerkat ingest
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - run: npm install -g @testsprite/testsprite-cli
      - run: testsprite setup --from-env --no-agent -y
        env:
          TESTSPRITE_API_KEY: \${{ secrets.TESTSPRITE_API_KEY }}
      - run: node scripts/ingest-latest.mjs
        env:
          MEERKAT_API_URL: https://meerkat-app.vercel.app
          MEERKAT_API_KEY: \${{ secrets.MEERKAT_API_KEY }}
          MEERKAT_PROJECT_SLUG: ${slug}
          TESTSPRITE_PROJECT_ID: \${{ vars.TESTSPRITE_PROJECT_ID }}
          GITHUB_SHA: \${{ github.event.pull_request.head.sha }}
          GITHUB_PR: \${{ github.event.pull_request.number }}
          GITHUB_BRANCH: \${{ github.event.pull_request.head.ref }}`
}

function Onboarding() {
  const { session } = Route.useRouteContext() as { session: AppSession }
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [workspaceName, setWorkspaceName] = useState(session.workspace.name)
  const [project, setProject] = useState<{ name: string; slug: string } | null>(null)
  const [plaintext, setPlaintext] = useState<string | null>(null)

  async function saveWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = workspaceName.trim()
    if (!name) return
    setBusy(true)
    setError(null)
    const result = await updateWorkspaceFn({ data: { name } })
    setBusy(false)
    if (!result.ok) {
      setError('Could not save the workspace name.')
      return
    }
    setStep(1)
  }

  async function saveProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError(null)
    const result = await createProjectFn({
      data: {
        name: String(form.get('name') ?? '').trim(),
        repoUrl: String(form.get('repoUrl') ?? '').trim(),
        isPublic: form.get('isPublic') === 'on',
      },
    })
    setBusy(false)
    if (!result.ok) {
      setError('Could not create the project.')
      return
    }
    setProject({ name: result.project.name, slug: result.project.slug })
    setStep(2)
  }

  async function generateKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError(null)
    const result = await createKeyFn({
      data: {
        name: String(form.get('name') ?? '').trim() || 'GitHub Actions',
        expiresInDays: 365,
      },
    })
    setBusy(false)
    if (!result.ok) {
      setError('Could not generate the key.')
      return
    }
    setPlaintext(result.plaintext)
    setStep(3)
  }

  async function finish() {
    setBusy(true)
    await completeOnboardingFn()
    setBusy(false)
    navigate({ to: '/dashboard' })
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-2xs font-medium uppercase tracking-wider text-accent">Setup</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Get Meerkat scoring your suite
          </h1>
        </div>
        <Badge tone="neutral">
          Step {step + 1} of {STEPS.length}
        </Badge>
      </div>

      <ol className="mt-6 flex items-center gap-2" aria-label="Onboarding progress">
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={
                index < step
                  ? 'flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-ink'
                  : index === step
                    ? 'flex h-5 w-5 items-center justify-center rounded-full border border-accent text-2xs text-accent'
                    : 'flex h-5 w-5 items-center justify-center rounded-full border border-line text-2xs text-ink-subtle'
              }
            >
              {index < step ? <CheckIcon width={11} height={11} /> : index + 1}
            </span>
            <span
              className={cn(
                'text-2xs',
                index === step ? 'font-medium text-ink' : 'hidden text-ink-subtle sm:inline',
              )}
            >
              {label}
            </span>
            {index < STEPS.length - 1 && <span className="h-px flex-1 bg-line" aria-hidden />}
          </li>
        ))}
      </ol>

      <div className="mt-6">
        {step === 0 && (
          <Card>
            <CardHeader title="Name your workspace" description="The tenant boundary for projects, runs and keys." />
            <CardContent>
              <form onSubmit={saveWorkspace} className="space-y-3">
                <Field label="Workspace name" htmlFor="ws-name">
                  <Input
                    id="ws-name"
                    value={workspaceName}
                    onChange={(event) => setWorkspaceName(event.target.value)}
                    autoFocus
                    required
                  />
                </Field>
                <p className="text-2xs text-ink-subtle">
                  Slug: <code className="font-mono">{session.workspace.slug}</code>
                </p>
                <Button variant="primary" type="submit" disabled={busy}>
                  {busy ? 'Saving…' : 'Continue'} <ArrowRightIcon width={14} height={14} />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader title="Create your first project" description="One project per repository." />
            <CardContent>
              <form onSubmit={saveProject} className="space-y-3">
                <Field label="Project name" htmlFor="project-name" required>
                  <Input id="project-name" name="name" required placeholder="acme-api" autoFocus />
                </Field>
                <Field label="Repository URL" htmlFor="project-repo" hint="Used for commit links.">
                  <Input id="project-repo" name="repoUrl" type="url" placeholder="https://github.com/acme/api" />
                </Field>
                <label className="flex items-start gap-2 text-xs text-ink-muted">
                  <input type="checkbox" name="isPublic" className="mt-0.5 h-4 w-4 accent-accent" />
                  <span>Publish a read-only scorecard for this project.</span>
                </label>
                <div className="flex items-center gap-3">
                  <Button onClick={() => setStep(0)} disabled={busy}>
                    <ArrowLeftIcon width={14} height={14} /> Back
                  </Button>
                  <Button variant="primary" type="submit" disabled={busy}>
                    {busy ? 'Creating…' : 'Continue'} <ArrowRightIcon width={14} height={14} />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader
              title="Generate an API key"
              description="Meerkat generates it. You copy it once — only a hash is stored."
            />
            <CardContent>
              <form onSubmit={generateKey} className="space-y-3">
                <Field label="Key name" htmlFor="key-name" hint="Usually the CI provider.">
                  <Input id="key-name" name="name" defaultValue="GitHub Actions" autoFocus />
                </Field>
                <p className="text-2xs text-ink-subtle">
                  Scope: ingest + read · Expiry: 365 days · Project: {project?.name ?? 'this workspace'}
                </p>
                <div className="flex items-center gap-3">
                  <Button onClick={() => setStep(1)} disabled={busy}>
                    <ArrowLeftIcon width={14} height={14} /> Back
                  </Button>
                  <Button variant="primary" type="submit" disabled={busy}>
                    {busy ? 'Generating…' : 'Generate key'} <ArrowRightIcon width={14} height={14} />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <Card>
              <CardHeader
                title="Copy your key now"
                description="This is the only time it is visible. Store it as MEERKAT_API_KEY in your repository secrets."
              />
              <CardContent>
                <CodeBlock code={plaintext ?? ''} language="api key" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Add the workflow"
                description={`Commit this to .github/workflows/meerkat.yml — project ${project?.slug ?? ''}.`}
              />
              <CardContent>
                <CodeBlock code={workflow(project?.slug ?? 'your-project')} language="yaml" />
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <Button onClick={() => setStep(2)} disabled={busy}>
                <ArrowLeftIcon width={14} height={14} /> Back
              </Button>
              <Button variant="primary" onClick={finish} disabled={busy}>
                {busy ? 'Finishing…' : 'Finish setup'} <ArrowRightIcon width={14} height={14} />
              </Button>
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-2xs text-danger">{error}</p>}
      </div>
    </div>
  )
}
