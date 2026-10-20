import { createFileRoute, Link } from '@tanstack/react-router'

import { PageHeader } from '@/components/ui/layout'
import { Alert, Button, Card, CardContent, CardHeader, EmptyState } from '@/components/ui/primitives'
import { CodeBlock } from '@/components/ui/code'
import { PlugIcon } from '@/components/ui/icons'
import { listProjectsFn } from '@/server/projects'

export const Route = createFileRoute('/_authed/_app/integrations')({
  loader: () => listProjectsFn(),
  component: Integrations,
})

function workflow(projectSlug: string): string {
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
          MEERKAT_PROJECT_SLUG: ${projectSlug}
          TESTSPRITE_PROJECT_ID: \${{ vars.TESTSPRITE_PROJECT_ID }}
          GITHUB_SHA: \${{ github.event.pull_request.head.sha }}
          GITHUB_PR: \${{ github.event.pull_request.number }}
          GITHUB_BRANCH: \${{ github.event.pull_request.head.ref }}`
}

function Integrations() {
  const projects = Route.useLoaderData()
  const project = projects[0]

  return (
    <>
      <PageHeader
        title="Integrations"
        description="How runs reach this workspace. One key, one workflow file."
      />

      <div className="space-y-4 p-6">
        {!project ? (
          <Card>
            <EmptyState
              icon={<PlugIcon />}
              title="Create a project first"
              description="The workflow needs a project slug to post runs into."
              action={
                <Link to="/projects">
                  <Button variant="primary">Go to projects</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <>
            <Alert tone="info" title="Two secrets, one workflow">
              <ol className="mt-1 list-decimal space-y-1 pl-4">
                <li>
                  Create an API key in{' '}
                  <Link to="/api-keys" className="text-accent hover:text-accent-strong">
                    API keys
                  </Link>{' '}
                  and save it as the repository secret <code className="font-mono">MEERKAT_API_KEY</code>.
                </li>
                <li>
                  Keep your existing <code className="font-mono">TESTSPRITE_API_KEY</code> and{' '}
                  <code className="font-mono">TESTSPRITE_PROJECT_ID</code>.
                </li>
                <li>Commit the workflow below to .github/workflows/meerkat.yml.</li>
              </ol>
            </Alert>

            <Card>
              <CardHeader
                title="Workflow file"
                description={`Project: ${project.name} (${project.slug})`}
              />
              <CardContent>
                <CodeBlock code={workflow(project.slug)} language="yaml" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="What gets ingested" />
              <CardContent className="space-y-1 text-xs leading-relaxed text-ink-muted">
                <p>
                  Each run posts the JUnit artifact, the commit SHA, the PR number and the branch.
                  Meerkat parses every testcase, matches it to SPEC.md scenarios, and scores the
                  evidence.
                </p>
                <p className="text-2xs text-ink-subtle">
                  Re-ingesting the same commit is idempotent: the dedupe key is project + SHA +
                  wave start.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  )
}
