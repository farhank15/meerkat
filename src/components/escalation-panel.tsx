// SV-FIX-06: a failed fix attempt is escalated to a human instead of being
// forced green. Realised on the audit surface so the attempt count, the red
// rerun state, and the "escalated to human" label are all visible evidence.

import { Badge, Card, CardHeader } from '@/components/ui/primitives'
import type { Escalation } from '@/lib/store'

export function EscalationPanel({ escalations }: { escalations?: Escalation[] }) {
  if (!escalations || escalations.length === 0) return null
  return (
    <Card>
      <CardHeader
        title="Escalated fix attempts"
        description="Failed fix attempts handed to a human instead of forced green (SV-FIX-06)."
      />
      <ul className="divide-y divide-line">
        {escalations.map((e) => (
          <li key={e.specId} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-2xs text-ink">{e.specId}</span>
              <Badge tone="danger">escalated to human</Badge>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-2xs sm:grid-cols-4">
              <div>
                <dt className="text-ink-subtle">Attempts</dt>
                <dd className="mono-nums text-ink">
                  {e.attempts} of {e.maxAttempts}
                </dd>
              </div>
              <div>
                <dt className="text-ink-subtle">Rerun</dt>
                <dd>
                  <Badge tone={e.rerun === 'red' ? 'danger' : 'ok'}>{e.rerun}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-ink-subtle">Result</dt>
                <dd className="mono-nums text-ink">{e.result}</dd>
              </div>
              <div>
                <dt className="text-ink-subtle">Retries</dt>
                <dd className="mono-nums text-ink">{e.maxAttempts}</dd>
              </div>
            </dl>
            <p className="mt-2 text-2xs leading-relaxed text-ink-muted">
              After {e.attempts} attempt{e.attempts === 1 ? '' : 's'} the rerun was still red, so the
              loop stopped and escalated to a human — Meerkat never retries more than once.
            </p>
          </li>
        ))}
      </ul>
    </Card>
  )
}
