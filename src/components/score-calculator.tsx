// Public, auth-free TSI calculator. Wired to the exact same rounding logic the
// backend scorer uses (`computeTsi` / `roundHalfAwayFromZero` from @/lib/tsi) so
// a boundary-case input produces the same TSI Meerkat would report — no forked
// math, no client-only approximation.
//
// The computed result is rendered into stable DOM nodes (`#tsi-result`,
// `#round-result`) so an automated rounding check can submit a value and read
// the output back as text.

import { useState } from 'react'

import { computeTsi, roundHalfAwayFromZero } from '@/lib/tsi'

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  hint: string
}) {
  return (
    <label className="flex flex-col gap-1 text-2xs">
      <span className="font-medium text-ink">{label}</span>
      <input
        type="number"
        min={0}
        max={100}
        step={0.1}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => {
          const n = Number(e.target.value)
          onChange(Number.isFinite(n) ? n : 0)
        }}
        className="w-full rounded-md border border-line bg-canvas px-2.5 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent"
        aria-label={label}
      />
      <span className="text-ink-subtle">{hint}</span>
    </label>
  )
}

export function ScoreCalculator() {
  const [coverage, setCoverage] = useState(93)
  const [stability, setStability] = useState(97)
  const [passRate, setPassRate] = useState(94)
  const [raw, setRaw] = useState('95.5')

  const tsi = computeTsi({
    coverage: coverage / 100,
    stability: stability / 100,
    passRate: passRate / 100,
  })

  const rawNum = Number(raw)
  const rounded = Number.isFinite(rawNum) ? roundHalfAwayFromZero(rawNum) : null

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Coverage %" value={coverage} onChange={setCoverage} hint="weight 50%" />
        <Field label="Stability %" value={stability} onChange={setStability} hint="weight 30%" />
        <Field label="Pass rate %" value={passRate} onChange={setPassRate} hint="weight 20%" />
      </div>

      <div className="rounded-md border border-line bg-canvas px-4 py-3">
        <p className="text-2xs uppercase tracking-wider text-ink-subtle">Computed TSI</p>
        <p id="tsi-result" className="mono-nums mt-1 text-2xl font-semibold text-ink" data-testid="tsi-result">
          {tsi}
        </p>
        <p className="mt-1 text-2xs text-ink-subtle">
          TSI = round(100 × (0.50·coverage + 0.30·stability + 0.20·pass rate)) — half-up, deterministic.
        </p>
      </div>

      <div id="round" className="scroll-mt-24 rounded-md border border-line bg-canvas px-4 py-3">
        <p className="text-2xs uppercase tracking-wider text-ink-subtle">
          Round a boundary value — half-up
        </p>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-2xs">
            <span className="font-medium text-ink">Value to round</span>
            <input
              type="number"
              step="any"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              className="w-40 rounded-md border border-line bg-canvas px-2.5 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent"
              aria-label="Value to round"
            />
          </label>
          <span className="text-2xs text-ink-subtle">
            e.g. <code className="font-mono">95.4999 → 95</code>,{' '}
            <code className="font-mono">95.5 → 96</code>
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[
            ['95.5 → 96', '95.5'],
            ['93.5 → 94', '93.5'],
            ['95.4999 → 95', '95.4999'],
            ['93.365 → 93', '93.365'],
          ].map(([label, value]) => (
            <button
              key={value}
              type="button"
              onClick={() => setRaw(value)}
              className="rounded border border-line bg-surface-raised px-2 py-1 font-mono text-2xs text-ink-muted transition-colors hover:border-accent hover:text-ink"
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-2xs text-ink-subtle">
          Rounded result:{' '}
          <span id="round-result" className="mono-nums font-semibold text-ink" data-testid="round-result">
            {rounded ?? '—'}
          </span>
        </p>
        <p className="mt-1 text-2xs text-ink-subtle">
          Half-up means a tie always moves away from zero: <span className="font-mono text-ink">93.5 → 94</span>,{' '}
          <span className="font-mono text-ink">95.5 → 96</span>. It is never banker's rounding, so a
          reported score never flips because the digit before the tie happened to be even.
        </p>
      </div>
    </div>
  )
}
