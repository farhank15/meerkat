// Public run detail, reachable from a shared scorecard without signing in.
// Scoped to the public project named in the URL.

import { Link, createFileRoute, notFound } from '@tanstack/react-router'

import { Alert, Badge, Card, CardHeader, Stat, StatusBadge } from '@/components/ui/primitives'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { ArrowLeftIcon, ExternalIcon } from '@/components/ui/icons'
import { getPublicRunFn } from '@/server/public'
import type { LoopAction } from '@/lib/store'

import ratchetBaseline from '@/../baseline/tsi.json'

export const Route = createFileRoute('/share/$slug/run/$id')({
  loader: async ({ params }) => {
    const result = await getPublicRunFn({ data: { slug: params.slug, id: params.id } })
    if (!result) throw notFound()
    return result
  },
  component: PublicRun,
})

function commitUrl(repoUrl: string | null, sha: string | null): string | null {
  if (!repoUrl || !sha || !/^[0-9a-f]{40}$/.test(sha)) return null
  return `${repoUrl}/commit/${sha}`
}

function LoopPanel({ loop }: { loop: LoopAction }) {
  const escalated =
    loop.result === 'failed' || loop.result === 'escalated' || /escalat/i.test(loop.action)
  return (
    <Card className="mt-4">
      <CardHeader
        title="Fix loop"
        description="How this run moved from a red verdict to a trusted one — or why it was escalated."
        action={
          escalated ? (
            <Badge tone="danger">escalated to human</Badge>
          ) : (
            <Badge tone={loop.result === 'green' ? 'ok' : 'warn'}>{loop.result}</Badge>
          )
        }
      />
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 py-3 text-2xs sm:grid-cols-4">
        {[
          ['PR', loop.pr],
          ['Classification', loop.classification],
          ['Action', loop.action],
          ['Result', loop.result],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex justify-between gap-3">
            <dt className="text-ink-subtle">{label}</dt>
            <dd className="mono-nums text-ink-muted">{value}</dd>
          </div>
        ))}
      </dl>
      {loop.fixCommit && (
        <div className="border-t border-line px-4 py-2.5">
          <a
            href={`https://github.com/farhank15/meerkat/commit/${loop.fixCommit}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-2xs text-accent hover:text-accent-strong"
          >
            fix commit {loop.fixCommit.slice(0, 8)} <ExternalIcon width={10} height={10} />
          </a>
        </div>
      )}
    </Card>
  )
}

function PrChecksPanel({ baseline }: { baseline: number }) {
  return (
    <Card className="mt-4">
      <CardHeader title="PR Checks" description="What GitHub reports on every pull request against this project." />
      <ul className="divide-y divide-line">
        <li className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="font-mono text-2xs text-ink">testsprite-dev</p>
            <p className="mt-0.5 text-2xs text-ink-subtle">TestSprite GitHub App · full suite, every pull request</p>
          </div>
          <Badge tone="ok">required</Badge>
        </li>
        <li className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="font-mono text-2xs text-ink">SuiteVitals Ratchet</p>
            <p className="mt-0.5 text-2xs text-ink-subtle">fixed main baseline · a drop below it keeps the loop from going green</p>
          </div>
          <Badge tone="info">baseline {baseline}</Badge>
        </li>
      </ul>
    </Card>
  )
}

function PublicRun() {
  const { id, run, project, meta } = Route.useLoaderData()
  const scored = run.status === 'complete'
  const commit = commitUrl(project.repoUrl, meta.sha)
  const failing = (run.testCases ?? []).filter((testCase) => testCase.status === 'failed')
  const shallowCount = (run.testCases ?? []).filter((testCase) => testCase.shallow).length
  const metric = run.metric

  const ratio = (value: number | undefined) =>
    typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : '—'

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10">
      <Link
        to="/share/$slug"
        params={{ slug: project.slug }}
        className="inline-flex items-center gap-1.5 text-2xs text-ink-subtle hover:text-ink"
      >
        <ArrowLeftIcon width={12} height={12} /> {project.name} scorecard
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Run {id.slice(0, 8)}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-2xs text-ink-muted">
            {commit ? (
              <a
                href={commit}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-accent hover:text-accent-strong"
              >
                {meta.sha?.slice(0, 8)} <ExternalIcon width={10} height={10} />
              </a>
            ) : (
              <span className="font-mono">{meta.sha?.slice(0, 8) ?? 'no commit'}</span>
            )}
            {meta.pr && <span>· PR #{meta.pr}</span>}
            {meta.startedAt && <span>· {new Date(meta.startedAt).toISOString().slice(0, 16).replace('T', ' ')} UTC</span>}
          </div>
        </div>
        <StatusBadge status={run.status} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Test Strength Index"
          value={scored ? (metric?.tsi ?? '—') : '—'}
          hint={scored ? 'Deterministic score' : 'Verdict withheld'}
          tone={
            !scored || typeof metric?.tsi !== 'number'
              ? 'neutral'
              : metric.tsi >= 80
                ? 'ok'
                : metric.tsi >= 50
                  ? 'warn'
                  : 'danger'
          }
        />
        <Stat label="Coverage" value={ratio(metric?.coverage)} hint="Weight 50%" />
        <Stat label="Stability" value={ratio(metric?.stability)} hint="Weight 30%" />
        <Stat label="Pass rate" value={ratio(metric?.passRate)} hint="Meaningful passes only" />
      </div>

      {run.verdict && (
        <Alert
          tone={run.verdict.state === 'green' ? 'ok' : run.verdict.state === 'failed' ? 'danger' : 'warn'}
          title={run.verdict.label}
          className="mt-4"
        >
          {run.verdict.detail}
        </Alert>
      )}

      {failing.length > 0 && (
        <Card className="mt-4">
          <CardHeader
            title={`${failing.length} failing test${failing.length === 1 ? '' : 's'}`}
            action={<Badge tone="danger">red</Badge>}
          />
          <Table caption="Failing tests">
            <THead>
              <TR>
                <TH>Test</TH>
                <TH>Spec</TH>
                <TH>Message</TH>
              </TR>
            </THead>
            <TBody>
              {failing.map((testCase) => (
                <TR key={testCase.name}>
                  <TD className="font-mono text-2xs text-ink">{testCase.name}</TD>
                  <TD className="font-mono text-2xs">{testCase.specId ?? '—'}</TD>
                  <TD className="text-2xs">{testCase.message ?? '—'}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {shallowCount > 0 && (
        <Alert
          tone="warn"
          title={`${shallowCount} shallow pass${shallowCount > 1 ? 'es' : ''} (1 assertion)`}
          className="mt-4"
        >
          These passed with a single assertion step. They do assert behaviour, so they count
          toward the pass rate — but the gate flags them so the reader knows the coverage is
          thin, not rich.
        </Alert>
      )}

      {run.loop && <LoopPanel loop={run.loop} />}

      <PrChecksPanel baseline={ratchetBaseline.tsi} />
    </div>
  )
}
