// SV-RAT-06: the two checks GitHub reports on every pull request — the full
// TestSprite App suite (required) and the fixed SuiteVitals Ratchet baseline.
// Rendered as its own run tab so the two checks are first-class, not buried in
// the overview.

import { Badge, Card, CardHeader } from '@/components/ui/primitives'

export function PrChecksPanel({
  baseline,
  className,
}: {
  baseline: number
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader
        title="PR Checks"
        description="What GitHub reports on every pull request against this project."
      />
      <ul className="divide-y divide-line">
        <li className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="font-mono text-2xs text-ink">testsprite-dev</p>
            <p className="mt-0.5 text-2xs text-ink-subtle">
              TestSprite GitHub App · full suite, every pull request
            </p>
          </div>
          <Badge tone="ok">required</Badge>
        </li>
        <li className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="font-mono text-2xs text-ink">SuiteVitals Ratchet</p>
            <p className="mt-0.5 text-2xs text-ink-subtle">
              fixed main baseline · a drop below it keeps the loop from going green
            </p>
          </div>
          <Badge tone="info">baseline {baseline}</Badge>
        </li>
      </ul>
    </Card>
  )
}
