import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '@/components/ui/code'
import { Alert, Card, CardContent, CardHeader } from '@/components/ui/primitives'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'

export const Route = createFileRoute('/_marketing/docs')({
  component: Docs,
})

const WORKFLOW = `name: Meerkat ingest
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
          MEERKAT_PROJECT_SLUG: your-project
          TESTSPRITE_PROJECT_ID: \${{ vars.TESTSPRITE_PROJECT_ID }}
          GITHUB_SHA: \${{ github.event.pull_request.head.sha }}
          GITHUB_PR: \${{ github.event.pull_request.number }}
          GITHUB_BRANCH: \${{ github.event.pull_request.head.ref }}`

const MCP = `{
  "mcpServers": {
    "meerkat": {
      "command": "npx",
      "args": ["-y", "meerkat-mcp"],
      "env": {
        "MEERKAT_API_URL": "https://meerkat-app.vercel.app",
        "MEERKAT_API_KEY": "mk_live_..."
      }
    }
  }
}`

const ENDPOINTS = [
  ['POST', '/api/runs', 'Ingest a run. Requires a key with the ingest scope.'],
  ['GET', '/api/runs?project=<slug>', 'Read runs. Public projects need no key; private ones need a workspace key.'],
  ['GET', '/api/agent-brief?project=<slug>', 'Verdict, coverage gaps and vacuous findings for an agent.'],
  ['GET', '/api/badge/tsi.svg?project=<slug>', 'Shields-style badge. Public projects with the badge enabled.'],
  ['GET', '/share/<slug>', 'The read-only scorecard a reviewer opens.'],
]

const TOOLS = [
  ['get_run_verdict', 'Latest TSI, verdict state, run id and commit.'],
  ['get_coverage_gaps', 'SPEC.md scenarios with no asserting test, each with its contract line.'],
  ['get_vacuous_findings', 'Assertion-quality state plus vacuous, orphan and conflict counts.'],
  ['get_tsi_summary', 'Everything above in one call.'],
]

function Docs() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-16">
      <div className="text-2xs font-medium uppercase tracking-wider text-accent">Docs</div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Connect Meerkat</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
        Three pieces: a project, an API key, and a workflow. Everything below is generated for your
        workspace after onboarding, with your own slug already filled in.
      </p>

      <div className="mt-10 space-y-4">
        <Card>
          <CardHeader title="1 · Create a project" description="One project per repository." />
          <CardContent className="text-xs leading-relaxed text-ink-muted">
            Open <span className="text-ink">Projects</span> in the console and add the repository you
            want scored. Public projects expose a read-only scorecard and a TSI badge; private
            projects require a read key and answer <span className="font-mono text-ink">404</span> to
            everyone else.
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="2 · Generate an API key" description="Meerkat generates it, you copy it once." />
          <CardContent className="space-y-2 text-xs leading-relaxed text-ink-muted">
            <p>
              Keys start with <code className="font-mono text-ink">mk_live_</code> and are shown
              exactly once. Meerkat stores a SHA-256 hash and a public prefix, so a leaked database
              never yields a working key.
            </p>
            <p>
              Scopes: <code className="font-mono text-ink">ingest</code> writes runs,{' '}
              <code className="font-mono text-ink">read</code> reads them. Expiry is 30, 90, 365 days
              or never. Revocation takes effect on the next request.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="3 · Add the workflow" description="Commit this file to .github/workflows/." />
          <CardContent>
            <CodeBlock code={WORKFLOW} language="yaml" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="4 · Read the verdict from an agent" description="MCP server, stdio." />
          <CardContent className="space-y-3">
            <p className="text-xs leading-relaxed text-ink-muted">
              The MCP server exposes four read-only tools. It talks only to the public HTTP API — no
              database credentials leave your machine.
            </p>
            <CodeBlock code={MCP} language="json" />
            <Table caption="MCP tools">
              <THead>
                <TR>
                  <TH>Tool</TH>
                  <TH>Answer</TH>
                </TR>
              </THead>
              <TBody>
                {TOOLS.map(([name, answer]) => (
                  <TR key={name}>
                    <TD className="font-mono text-2xs text-ink">{name}</TD>
                    <TD className="text-2xs">{answer}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-14 text-lg font-semibold tracking-tight text-ink">HTTP surface</h2>
      <p className="mt-1 text-xs text-ink-muted">
        Every read endpoint is project-scoped. Without <span className="font-mono text-ink">project</span>,
        only public projects are returned.
      </p>
      <div className="mt-4">
        <Table caption="HTTP endpoints">
          <THead>
            <TR>
              <TH>Method</TH>
              <TH>Path</TH>
              <TH>Purpose</TH>
            </TR>
          </THead>
          <TBody>
            {ENDPOINTS.map(([method, path, purpose]) => (
              <TR key={path}>
                <TD className="font-mono text-2xs text-ink-muted">{method}</TD>
                <TD className="font-mono text-2xs text-ink">{path}</TD>
                <TD className="text-2xs">{purpose}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      <h2 className="mt-14 text-lg font-semibold tracking-tight text-ink">Scoring CLI</h2>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">
        The same engine that scores ingested runs can score a local artifact. Identical input
        produces identical output, which is what makes the number testable.
      </p>
      <div className="mt-3">
        <CodeBlock
          code={`npm run score -- --junit testsprite-junit.xml --spec SPEC.md`}
          language="shell"
        />
      </div>

      <div className="mt-8">
        <Alert tone="info" title="Limits worth knowing">
          A private project answers <span className="font-mono text-ink">404</span>, never{' '}
          <span className="font-mono text-ink">403</span> — a forbidden response would confirm that
          the project exists. With no ingested run, the score and the badge read{' '}
          <span className="font-mono text-ink">n/a</span>. An ingest key is bound to one workspace;
          posting a slug that belongs to another workspace is rejected.
        </Alert>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
        <Link to="/login" search={{ mode: 'register' }} className="font-medium text-accent hover:text-accent-strong">
          Create a workspace
        </Link>
        <Link to="/how-it-works" className="font-medium text-ink-muted hover:text-ink">
          How the score works
        </Link>
      </div>
    </div>
  )
}
