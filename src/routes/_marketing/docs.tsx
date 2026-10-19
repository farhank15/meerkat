import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '@/components/ui/code'
import { Card, CardContent, CardHeader } from '@/components/ui/primitives'

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

function Docs() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-16">
      <div className="text-2xs font-medium uppercase tracking-wider text-accent">Docs</div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Connect Meerkat</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
        Three pieces: a project, an API key, and a workflow. Everything below is generated for your
        workspace after onboarding.
      </p>

      <div className="mt-10 space-y-4">
        <Card>
          <CardHeader title="1 · Create a project" description="One project per repository." />
          <CardContent className="text-xs leading-relaxed text-ink-muted">
            Open <Link to="/projects" className="text-accent hover:text-accent-strong">Projects</Link>{' '}
            and add the repository you want scored. Public projects expose a read-only scorecard and
            a TSI badge; private projects require a read key.
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
              or never.
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
              The MCP server exposes four read-only tools: run verdict, coverage gaps, vacuous
              findings, and the TSI summary. It talks only to the public HTTP API — no database
              credentials leave your machine.
            </p>
            <CodeBlock code={MCP} language="json" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
