// Unsmoothed TSI trend. Two points are the minimum: a single run has no shape,
// and drawing one would imply a trend that does not exist.

const WIDTH = 100
const HEIGHT = 32
const PAD = 4

export function Sparkline({
  points,
  className,
  showArea = false,
}: {
  points: Array<{ at: string; tsi: number | null }>
  className?: string
  showArea?: boolean
}) {
  const scored = points.filter((point): point is { at: string; tsi: number } => typeof point.tsi === 'number')
  if (scored.length < 2) return null

  const values = scored.map((point) => point.tsi)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const coords = values.map((value, index) => {
    const x = (index / (values.length - 1)) * WIDTH
    const y = HEIGHT - PAD - ((value - min) / span) * (HEIGHT - PAD * 2)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label={`Test Strength Index trend across ${scored.length} runs`}
    >
      {showArea && (
        <polygon
          points={`0,${HEIGHT} ${coords.join(' ')} ${WIDTH},${HEIGHT}`}
          fill="var(--color-accent-soft)"
        />
      )}
      <polyline
        points={coords.join(' ')}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/** Signed change between the last two scored runs, or null when unavailable. */
export function trendDelta(points: Array<{ at: string; tsi: number | null }>): number | null {
  const scored = points.filter((point): point is { at: string; tsi: number } => typeof point.tsi === 'number')
  if (scored.length < 2) return null
  return scored[scored.length - 1].tsi - scored[scored.length - 2].tsi
}
