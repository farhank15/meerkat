#!/usr/bin/env node
/**
 * Meerkat Verdict Tracer — a stdio MCP server that lets ANY coding agent read
 * Meerkat's verdict layer (TSI, coverage gaps, assertion-quality findings)
 * before acting — the "agent reads the failure bundle and fixes the root
 * cause" step of the test loop, as a first-class tool contract.
 *
 * Architecture: the server talks ONLY to the public HTTP API
 * (GET /api/agent-brief). It holds no database credentials and no write
 * access — read-scope by construction. Configure:
 *
 *   MEERKAT_API_URL=https://meerkat-app.vercel.app   (default)
 *   MEERKAT_READ_TOKEN=...  (optional bearer token, for future read keys)
 *
 * Claude Code / Cursor / any MCP host config (4 lines):
 *   "mcpServers": { "meerkat-verdict": {
 *     "command": "node", "args": ["<abs path>/mcp/server.mjs"] } }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const BASE = (process.env.MEERKAT_API_URL ?? 'https://meerkat-app.vercel.app').replace(/\/$/, '')
/** Which project the tools read. Defaults to the public showcase project. */
const PROJECT = process.env.MEERKAT_PROJECT_SLUG ?? 'meerkat-demo'

async function brief() {
  const headers = {}
  // MEERKAT_API_KEY is the workspace key; MEERKAT_READ_TOKEN is the legacy name.
  const token = process.env.MEERKAT_API_KEY ?? process.env.MEERKAT_READ_TOKEN
  if (token) headers.authorization = `Bearer ${token}`

  const res = await fetch(`${BASE}/api/agent-brief?project=${encodeURIComponent(PROJECT)}`, {
    headers,
  })
  if (!res.ok) throw new Error(`agent-brief ${res.status}`)
  return res.json()
}

/**
 * Empty Zod raw shape — the SDK's `tool()` takes a param map (raw shape), not a
 * z.object wrapper. `{}` = "this tool takes no arguments", validated server-side.
 */
const JsonOut = {}

/** Tools degrade gracefully: agents get a retryable error, not a protocol crash. */
function unreachable(err) {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: `agent-brief unreachable (${err.message ?? String(err)}) — retry or set MEERKAT_API_URL to a reachable base.`,
      },
    ],
  }
}

const server = new McpServer({ name: 'meerkat-verdict', version: '1.0.0' })

server.tool(
  'get_run_verdict',
  'Latest Meerkat verdict: TSI, state (green/incomplete/refused), label and which board it came from (live ingested run or committed baseline evidence).',
  JsonOut,
  async () => {
    try {
      const b = await brief()
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                ts: new Date().toISOString(),
                source: b.source,
                runId: b.runId,
                sha: b.sha,
                tsi: b.tsi,
                verdictState: b.verdictState,
                verdictLabel: b.verdictLabel,
                status: b.status,
                failing: b.failing ?? [],
              },
              null,
              2,
            ),
          },
        ],
      }
    } catch (err) {
      return unreachable(err)
    }
  },
)

server.tool(
  'get_coverage_gaps',
  'SPEC scenarios the suite does not cover yet: each gap id + its SPEC.md line, before writing new tests.',
  JsonOut,
  async () => {
    try {
      const b = await brief()
      const gaps = Array.isArray(b.coverageGaps) ? b.coverageGaps : []
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                source: b.source,
                covered: b.coverage?.covered ?? null,
                totalScenarios: b.coverage?.total ?? null,
                gaps,
                guidance:
                  'Each gap is a SPEC.md scenario with no asserting test. Write a test that asserts the scenario ID behaviour — do not weaken the scenario to make it pass.',
              },
              null,
              2,
            ),
          },
        ],
      }
    } catch (err) {
      return unreachable(err)
    }
  },
)

server.tool(
  'get_vacuous_findings',
  'Assertion-quality findings (Verdict-Trust Gate): passes not anchored to the contract — vacuous/orphan/conflict counts and the trust state.',
  JsonOut,
  async () => {
    try {
      const b = await brief()
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                source: b.source,
                assertionQuality: b.assertionQuality,
                guidance:
                  'If the trust state is suspect/caution, prioritise re-anchoring weak tests to contracted behaviour before adding coverage.',
              },
              null,
              2,
            ),
          },
        ],
      }
    } catch (err) {
      return unreachable(err)
    }
  },
)

server.tool(
  'get_tsi_summary',
  'Full brief in one call: project, TSI and its components, verdict, coverage, gaps, assertion quality and deep-links (badge, scorecard, SPEC contract).',
  JsonOut,
  async () => {
    try {
      const b = await brief()
      return {
        content: [{ type: 'text', text: JSON.stringify(b, null, 2) }],
      }
    } catch (err) {
      return unreachable(err)
    }
  },
)

await server.connect(new StdioServerTransport())
console.error(`meerkat-verdict MCP ready → ${BASE}/api/agent-brief (read-only)`)
