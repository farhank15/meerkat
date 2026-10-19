// The Loop page: what Meerkat does with a run that is not green. Three states
// matter and they are deliberately kept apart — a regression (fix the code), a
// spec drift (fix the test), and an incomplete rerun (fix nothing, withhold the
// score). Conflating them is how a red build gets "fixed" by deleting a test.

import { createFileRoute, Link } from '@tanstack/react-router'
import { DEMO_PROJECT, DEMO_RUN, DEMO_RUN_2, getLoop } from '@/lib/store'
import { AuthGate } from '@/components/AuthGate'
import { BorderBeam } from '@/components/magicui'
import { Container } from '@/components/site'

export const Route = createFileRoute('/loop')({
  component: LoopPage,
})

function LoopPage() {
  return (
    <AuthGate>
      <LoopContent />
    </AuthGate>
  )
}

function LoopContent() {
  const loops = getLoop(DEMO_RUN.projectId)
  const failed = DEMO_RUN.testCases.filter((t) => t.status === 'failed')
  const incomplete = DEMO_RUN_2.verdict

  return (
    <Container className="py-12">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-50">The Loop</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-400">
        Every red run is classified before anything is touched. The classification decides
        what gets changed — and a refusal never counts as a failure.
      </p>

      {/* Trust summary: what the loop has been asked to handle. */}
      <section id="trust" className="mt-8 scroll-mt-24">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Trust summary
        </h2>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50">
          <BorderBeam />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-neutral-500">
                <th className="px-5 py-3 font-medium">Run</th>
                <th className="px-5 py-3 font-medium">Classification</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {loops.map((l) => (
                <tr key={l.pr} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-2.5 text-neutral-300">{l.pr}</td>
                  <td className="px-5 py-2.5 text-neutral-300">{l.classification}</td>
                  <td className="px-5 py-2.5 text-neutral-400">{l.action}</td>
                  <td className="px-5 py-2.5">
                    <span
                      className={
                        l.result === 'green'
                          ? 'text-emerald-400'
                          : l.result === 'neutral'
                            ? 'text-amber-400'
                            : 'text-neutral-400'
                      }
                    >
                      {l.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Spec drift guidance — the distinction that prevents the wrong fix. */}
      <section id="spec-drift" className="mt-10 scroll-mt-24">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Spec drift guidance
        </h2>
        <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-5">
          <p className="text-sm text-neutral-300">
            A failing test is not automatically a bug. Before dispatching a fix, Meerkat
            asks whether the <em>contract</em> changed instead of the code.
          </p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/5 bg-neutral-950/40 p-3">
              <dt className="text-xs font-semibold text-rose-300">Regression</dt>
              <dd className="mt-1 text-xs text-neutral-400">
                The scenario still exists in SPEC.md and the app no longer satisfies it.
                Action: fix the code.
              </dd>
            </div>
            <div className="rounded-xl border border-white/5 bg-neutral-950/40 p-3">
              <dt className="text-xs font-semibold text-amber-300">Spec drift</dt>
              <dd className="mt-1 text-xs text-neutral-400">
                The scenario was edited or removed since the last run, so the test is now
                asserting an old contract. Action: update the test — never the app.
              </dd>
            </div>
            <div className="rounded-xl border border-white/5 bg-neutral-950/40 p-3">
              <dt className="text-xs font-semibold text-neutral-300">Refused</dt>
              <dd className="mt-1 text-xs text-neutral-400">
                The testcase never executed. Action: none. It is not counted as failed and
                it does not lower the score.
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-neutral-500">
            The rule: a drift updates the test, a regression updates the code. If the
            evidence cannot tell them apart, the run is held instead of guessed.
          </p>
        </div>
      </section>

      {/* A failed verdict, shown before remediation is proposed. */}
      <section id="verdict-failed" className="mt-10 scroll-mt-24">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Failed verdict — before remediation
        </h2>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/3 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-rose-300">
              {DEMO_RUN.verdict?.label}
            </p>
            <Link
              to="/runs/$id"
              params={{ id: DEMO_RUN.id }}
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              Open run {DEMO_RUN.id} →
            </Link>
          </div>
          <p className="mt-2 text-xs text-neutral-400">{DEMO_RUN.verdict?.detail}</p>

          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Failing testcases ({failed.length})
          </h3>
          <ul className="mt-2 space-y-2">
            {failed.map((t) => (
              <li
                key={t.name}
                className="rounded-xl border border-white/5 bg-neutral-950/40 px-4 py-2.5"
              >
                <div className="text-xs text-neutral-300">{t.name}</div>
                <div className="mt-0.5 font-mono text-[11px] text-rose-400/80">
                  {t.message}
                </div>
              </li>
            ))}
          </ul>

          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Remediation
          </h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-neutral-400">
            <li>Classify each failure as regression or drift — never both.</li>
            <li>
              For a regression, dispatch a fix against the failing testcase only; the
              suite keeps running so the fix cannot trade one failure for another.
            </li>
            <li>
              Re-run and compare against the baseline. A drop below the baseline blocks
              the merge.
            </li>
          </ol>

          {DEMO_RUN.loop?.fixCommit && (
            <p className="mt-3 text-xs text-neutral-500">
              Fix commit that closed the loop:{' '}
              <a
                href={`${DEMO_PROJECT.repoUrl}/commit/${DEMO_RUN.loop.fixCommit}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline"
              >
                {DEMO_RUN.loop.fixCommit.slice(0, 7)} ↗
              </a>
            </p>
          )}
        </div>
      </section>

      {/* An incomplete rerun: evidence missing, so the score is withheld. */}
      <section id="verdict-incomplete" className="mt-10 scroll-mt-24">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Incomplete rerun — verdict handling
        </h2>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/3 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-amber-300">{incomplete?.label}</p>
            <Link
              to="/runs/$id"
              params={{ id: DEMO_RUN_2.id }}
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              Open run {DEMO_RUN_2.id} →
            </Link>
          </div>
          <p className="mt-2 text-xs text-neutral-400">{incomplete?.detail}</p>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-white/5 bg-neutral-950/40 p-3">
              <dt className="text-[11px] text-neutral-500">Requested</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-neutral-200">
                {incomplete?.requested}
              </dd>
            </div>
            <div className="rounded-xl border border-white/5 bg-neutral-950/40 p-3">
              <dt className="text-[11px] text-neutral-500">Completed</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-emerald-400">
                {incomplete?.completed}
              </dd>
            </div>
            <div className="rounded-xl border border-white/5 bg-neutral-950/40 p-3">
              <dt className="text-[11px] text-neutral-500">Refused</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-amber-400">
                {incomplete?.refused}
              </dd>
            </div>
          </dl>
          <p className="mt-3 font-mono text-xs text-neutral-500">
            {incomplete?.completed}/{incomplete?.requested} completed, {incomplete?.refused}{' '}
            refused · check neutral · TSI n/a
          </p>
        </div>
      </section>
    </Container>
  )
}
