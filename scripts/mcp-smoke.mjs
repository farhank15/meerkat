import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const transport = new StdioClientTransport({
  command: 'node',
  args: [new URL('../mcp/server.mjs', import.meta.url).pathname],
  env: { ...process.env, MEERKAT_API_URL: 'http://localhost:4322' },
})
const client = new Client({ name: 'test', version: '1.0.0' })
await client.connect(transport)

const tools = await client.listTools()
console.log('tools:', tools.tools.map(t => t.name).join(', '))

const verdict = await client.callTool({ name: 'get_run_verdict', arguments: {} })
console.log('verdict →', verdict.content[0].text.slice(0, 300))

const gaps = await client.callTool({ name: 'get_coverage_gaps', arguments: {} })
console.log('gaps →', gaps.content[0].text.slice(0, 300))

const vac = await client.callTool({ name: 'get_vacuous_findings', arguments: {} })
console.log('vac →', vac.content[0].text.slice(0, 300))
await client.close()
