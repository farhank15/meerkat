import { createFileRoute, Link } from '@tanstack/react-router'

import { PageHeader } from '@/components/ui/layout'
import { Card, CardContent, CardHeader } from '@/components/ui/primitives'
import { CodeBlock } from '@/components/ui/code'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'

export const Route = createFileRoute('/_authed/_app/mcp')({
  component: McpPage,
})

const CONFIG = `{
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

const TOOLS = [
  { name: 'get_run_verdict', returns: 'Latest verdict, TSI and run id', use: 'Before fixing a red wave.' },
  { name: 'get_coverage_gaps', returns: 'Uncovered SPEC.md scenarios', use: 'Decide what to test next.' },
  { name: 'get_vacuous_findings', returns: 'Passes that assert nothing', use: 'Find false confidence.' },
  { name: 'get_tsi_summary', returns: 'Score with its three components', use: 'Explain a drop to a reviewer.' },
]

function McpPage() {
  return (
    <>
      <PageHeader
        title="MCP & CLI"
        description="Read the verdict from any agent before it changes code. Read-only by construction."
      />

      <div className="space-y-4 p-6">
        <Card>
          <CardHeader title="MCP server" description="stdio transport, four read-only tools." />
          <CardContent className="space-y-3">
            <p className="text-xs leading-relaxed text-ink-muted">
              Add this block to your MCP host (Claude Code, Cursor, or any stdio client). The server
              talks only to the HTTP API — it holds no database credentials.
            </p>
            <CodeBlock code={CONFIG} language="json" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Tools" />
          <Table caption="MCP tools">
            <THead>
              <TR>
                <TH>Tool</TH>
                <TH>Returns</TH>
                <TH>Use it for</TH>
              </TR>
            </THead>
            <TBody>
              {TOOLS.map((tool) => (
                <TR key={tool.name}>
                  <TD className="font-mono text-2xs text-ink">{tool.name}</TD>
                  <TD className="text-2xs">{tool.returns}</TD>
                  <TD className="text-2xs">{tool.use}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card>
          <CardHeader title="CLI" description="Offline scoring, same engine." />
          <CardContent className="space-y-3">
            <CodeBlock
              code={`npx suitevitals score --junit testsprite-junit.xml --spec SPEC.md`}
              language="bash"
            />
            <p className="text-2xs text-ink-subtle">
              Exit 0 scored · 2 missing argument · 3 missing file. Malformed XML reports
              parse-error, never a crash. See the{' '}
              <Link to="/docs" className="text-accent hover:text-accent-strong">
                docs
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
