// Browser-accessible version of the scoring CLI. The CLI itself needs a local
// JUnit artifact, which a browser cannot read — so this surface takes the three
// normalised signals directly and runs the exact same `computeTsi` /
// `roundHalfAwayFromZero` pair, printing the raw value before rounding so the
// half-up boundary is observable end to end.

import { useState } from 'react'

import { computeTsi } from '@/lib/tsi'

const USAGE = 'score --coverage <0-100> --stability <0-100> --pass-rate <0-100>'
const DEFAULT_COMMAND = 'score --coverage 90 --stability 95 --pass-rate 100'

const PRESETS: Array<{ label: string; command: string }> = [
  { label: '93.5 → 94 (boundary)', command: 'score --coverage 90 --stability 95 --pass-rate 100' },
  { label: '95.5 → 96 (boundary)', command: 'score --coverage 91 --stability 100 --pass-rate 100' },
  { label: '93.365 → 93', command: 'score --coverage 90.909 --stability 97.015 --pass-rate 94.03' },
]

interface Signals {
  coverage: number
  stability: number
  passRate: number
}

type ParseResult = { ok: true; value: Signals } | { ok: false; error: string }

const FLAG_KEYS: Record<string, keyof Signals> = {
  '--coverage': 'coverage',
  '--stability': 'stability',
  '--pass-rate': 'passRate',
  '--pass_rate': 'passRate',
}

export function parseScoreCommand(input: string): ParseResult {
  const tokens = input.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0 || tokens[0] !== 'score') {
    return { ok: false, error: `usage: ${USAGE}` }
  }

  const signals: Partial<Signals> = {}
  for (let i = 1; i < tokens.length; i += 2) {
    const flag = tokens[i]
    const key = FLAG_KEYS[flag]
    if (!key) return { ok: false, error: `unknown flag "${flag}" — usage: ${USAGE}` }
    const rawValue = tokens[i + 1]
    if (rawValue === undefined) return { ok: false, error: `missing value for ${flag}` }
    const value = Number(rawValue)
    if (!Number.isFinite(value)) return { ok: false, error: `${flag} must be a number` }
    if (value < 0 || value > 100) {
      return { ok: false, error: `${flag} must be between 0 and 100 (percent, not a fraction)` }
    }
    signals[key] = value
  }

  const missing = (['coverage', 'stability', 'passRate'] as const).filter(
    (key) => signals[key] === undefined,
  )
  if (missing.length > 0) {
    return { ok: false, error: `missing ${missing.join(', ')} — usage: ${USAGE}` }
  }

  return {
    ok: true,
    value: {
      coverage: signals.coverage as number,
      stability: signals.stability as number,
      passRate: signals.passRate as number,
    },
  }
}

function renderOutput(command: string): string {
  const parsed = parseScoreCommand(command)
  if (!parsed.ok) {
    return `$ suitevitals ${command}\n\n${parsed.error}\n\nexit 2 — missing or invalid argument`
  }

  const { coverage, stability, passRate } = parsed.value
  const raw = 100 * (0.5 * (coverage / 100) + 0.3 * (stability / 100) + 0.2 * (passRate / 100))
  const tsi = computeTsi({
    coverage: coverage / 100,
    stability: stability / 100,
    passRate: passRate / 100,
  })
  const isBoundary = Math.abs(raw - Math.floor(raw) - 0.5) < 1e-9

  return [
    `$ suitevitals ${command}`,
    '',
    `coverage   ${coverage.toFixed(3)}%  × 0.50 = ${(0.5 * coverage).toFixed(3)}`,
    `stability  ${stability.toFixed(3)}%  × 0.30 = ${(0.3 * stability).toFixed(3)}`,
    `pass rate  ${passRate.toFixed(3)}%  × 0.20 = ${(0.2 * passRate).toFixed(3)}`,
    '',
    `raw        ${raw.toFixed(3)}`,
    `tsi        ${tsi}      (half-up: ${raw.toFixed(3)} → ${tsi})`,
    isBoundary
      ? `boundary   raw ends in .5 → rounded away from zero, never to the even neighbour`
      : `boundary   not a tie; the nearest integer wins`,
    '',
    'exit 0 — scored',
  ].join('\n')
}

export function ScoreCli() {
  const [command, setCommand] = useState(DEFAULT_COMMAND)
  const [output, setOutput] = useState(() => renderOutput(DEFAULT_COMMAND))

  return (
    <div className="space-y-3">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setOutput(renderOutput(command))
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <span className="font-mono text-2xs text-ink-subtle">$</span>
        <input
          id="cli-command"
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          aria-label="Scoring command"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-md border border-line bg-canvas px-2.5 py-1.5 font-mono text-2xs text-ink outline-none focus:border-accent"
        />
        <button
          id="cli-run"
          type="submit"
          className="rounded-md border border-line bg-surface-raised px-3 py-1.5 text-2xs font-medium text-ink transition-colors hover:border-accent"
        >
          Run
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.command}
            type="button"
            onClick={() => {
              setCommand(preset.command)
              setOutput(renderOutput(preset.command))
            }}
            className="rounded border border-line bg-surface-raised px-2 py-1 font-mono text-2xs text-ink-muted transition-colors hover:border-accent hover:text-ink"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <pre
        id="cli-output"
        aria-live="polite"
        className="overflow-x-auto rounded-md border border-line bg-canvas px-3 py-2.5 font-mono text-2xs leading-relaxed text-ink"
      >
        {output}
      </pre>
      <p className="text-2xs text-ink-subtle">
        The CLI reads a JUnit file, which a browser cannot open — so this runs the same engine on
        the three signals that file produces. Identical input still gives identical output.
      </p>
    </div>
  )
}
