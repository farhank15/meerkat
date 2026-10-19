/**
 * magicui-lite — CSS-only adaptations of four MIT-licensed magicui.design
 * components (dot-pattern, marquee, border-beam, animated-shiny-text).
 * Zero runtime dependencies and SSR-safe: no hydration-sensitive animation
 * wrappers, no client-library weight, and rendered copy is always identical to
 * the static text (safe for the assertion-anchored suite).
 */

import type { ReactNode } from 'react'

/** DotPattern — quadratic dot grid as a repeating radial background. */
export function DotPattern({ className = '' }: { className?: string }) {
  const dots = new Array<ReactNode>(16).fill(null).map((_, row) =>
    new Array<ReactNode>(16).fill(null).map((_, col) => (
      <circle
        key={`${row}-${col}`}
        cx={col * 22 + 6}
        cy={row * 22 + 6}
        r="1"
        className="fill-neutral-600"
      />
    )),
  )
  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <defs>
        <radialGradient id="dotfade" cx="50%" cy="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0.5" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="dotmask">
          <rect width="100%" height="100%" fill="url(#dotfade)" />
        </mask>
      </defs>
      <g mask="url(#dotmask)">{dots}</g>
    </svg>
  )
}

/** Marquee — infinite horizontal loop. Pauses on hover; copy stays static. */
export function Marquee({
  children,
  reverse = false,
  className = '',
}: {
  children: ReactNode
  reverse?: boolean
  className?: string
}) {
  return (
    <div
      className={`group flex overflow-hidden ${className}`}
      style={{
        maskImage:
          'linear-gradient(to right, transparent, white 8%, white 92%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, white 8%, white 92%, transparent)',
      }}
    >
      <div
        className="flex shrink-0 items-center gap-8 pr-8 [animation-duration:36s] group-hover:[animation-play-state:paused]"
        style={{
          animation: `${reverse ? 'marquee-rev' : 'marquee'} 36s linear infinite`,
        }}
      >
        {children}
        <div aria-hidden className="contents">
          {children}
        </div>
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
@keyframes marquee-rev { from { transform: translateX(-50%) } to { transform: translateX(0) } }
@media (prefers-reduced-motion: reduce) { [style*='marquee'] { animation: none !important } }`}</style>
    </div>
  )
}

/**
 * BorderBeam — a light segment travelling along the card's top and bottom
 * edges. CSS-only: two 1px lines with a moving gradient segment; rendered
 * copy is untouched, so assertion-anchored DOM is safe.
 */
export function BorderBeam({ className = '' }: { className?: string }) {
  const beam: React.CSSProperties = {
    backgroundImage:
      'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.85) 50%, transparent 100%)',
    backgroundSize: '30% 100%',
    backgroundRepeat: 'no-repeat',
    animation: 'meerkat-beam-ride 4.5s linear infinite',
  }
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] ${className}`}
    >
      <div className="absolute left-0 top-0 h-px w-full" style={beam} />
      <div
        className="absolute bottom-0 left-0 h-px w-full"
        style={{ ...beam, animationDelay: '2.25s', animationDirection: 'reverse' }}
      />
      <style>{`@keyframes meerkat-beam-ride { 0% { background-position: 0% 0 } 100% { background-position: 100% 0 } }
@media (prefers-reduced-motion: reduce) { [style*='meerkat-beam-ride'] { animation: none !important } }`}</style>
    </div>
  )
}

/** ShinyText — animated sheen across text; the rendered copy never changes. */
export function ShinyText({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(120deg, rgba(255,255,255,0.45) 40%, #a7f3d0 50%, rgba(255,255,255,0.45) 60%)',
        backgroundSize: '220% 100%',
        animation: 'shinytext 5s ease-in-out infinite',
      }}
    >
      {children}
      <style>{`@keyframes shinytext { 0% { background-position: 120% 0 } 100% { background-position: -120% 0 } }
@media (prefers-reduced-motion: reduce) { [style*='shinytext'] { animation: none !important } }`}</style>
    </span>
  )
}

/**
 * Aurora — three slow-drifting blurred gradient blobs behind a surface.
 * Purely decorative; keep inside a `relative overflow-hidden` wrapper.
 */
export function Aurora({ className = '' }: { className?: string }) {
  const blob = (background: string, name: string, delay: string): React.CSSProperties => ({
    position: 'absolute' as const,
    height: '34rem',
    width: '34rem',
    borderRadius: '9999px',
    background,
    filter: 'blur(90px)',
    animation: `${name} 19s ease-in-out ${delay} infinite alternate`,
  })
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      <div style={blob('radial-gradient(closest-side, rgba(16,185,129,0.16), transparent)', 'aurora-a', '0s')} className="-top-40 left-1/4" />
      <div style={blob('radial-gradient(closest-side, rgba(59,130,246,0.12), transparent)', 'aurora-b', '-6s')} className="-top-24 right-1/4" />
      <div style={blob('radial-gradient(closest-side, rgba(168,85,247,0.10), transparent)', 'aurora-c', '-12s')} className="top-24 left-1/3" />
      <style>{`@keyframes aurora-a { to { transform: translate(6rem, 3rem) scale(1.08) } }
@keyframes aurora-b { to { transform: translate(-7rem, 2rem) scale(0.94) } }
@keyframes aurora-c { to { transform: translate(3rem, -4rem) scale(1.05) } }
@media (prefers-reduced-motion: reduce) { [style*='aurora-'] { animation: none !important } }`}</style>
    </div>
  )
}

/**
 * Spotlight — a static cone of light from the top edge (CSS-only version of
 * the magicui spotlight; no pointer tracking, so SSR stays deterministic).
 */
export function Spotlight({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        background:
          'radial-gradient(36rem 20rem at 50% -4rem, rgba(16,185,129,0.10), transparent 70%)',
      }}
    />
  )
}

/**
 * RetroGrid — receding perspective grid with a slow vertical drift.
 * Purely decorative backdrop (opacity ~0.4, aria-hidden).
 */
export function RetroGrid({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden [perspective:20rem] ${className}`}
    >
      <div
        className="absolute inset-0 [transform:rotateX(60deg)_translateZ(0)]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.35) 1px, transparent 1px)',
          backgroundSize: '3rem 3rem',
          animation: 'retrogrid-drift 24s linear infinite',
          maskImage: 'radial-gradient(60rem 30rem at 50% 0%, white, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(60rem 30rem at 50% 0%, white, transparent 75%)',
        }}
      />
      <style>{`@keyframes retrogrid-drift { from { background-position: 0 0 } to { background-position: 0 3rem } }
@media (prefers-reduced-motion: reduce) { [style*='retrogrid-drift'] { animation: none !important } }`}</style>
    </div>
  )
}

/**
 * Meteors — a fan of falling diagonal streaks between borders (the magicui
 * "meteors" idea). Decorative; place inside a `relative overflow-hidden` card.
 */
export function Meteors({ className = '' }: { className?: string }) {
  const streaks = [0, 1, 2, 3, 4]
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] ${className}`}>
      {streaks.map((i) => (
        <span
          key={i}
          className="absolute h-px w-24"
          style={{
            top: i % 2 === 0 ? '1.5rem' : '1rem',
            left: `${12 + i * 19}%`,
            transform: 'rotate(115deg)',
            background:
              'linear-gradient(90deg, rgba(16,185,129,0), rgba(110,231,183,0.9), rgba(16,185,129,0))',
            animation: `meerkat-meteor 6s linear ${i * 1.2}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes meerkat-meteor { 0% { opacity: 0; transform: rotate(115deg) translateX(0) } 10% { opacity: 1 } 40% { opacity: 0; transform: rotate(115deg) translateX(22rem) } 100% { opacity: 0; transform: rotate(115deg) translateX(0) } }
@media (prefers-reduced-motion: reduce) { [style*='meerkat-meteor'] { animation: none !important } }`}</style>
    </div>
  )
}

/**
 * MagicCard-lite — gradient-border card with a hover glow lift. CSS-only
 * sibling of magicui's MagicCard (no pointer tracking, SSR deterministic).
 */
export function MagicCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`group rounded-2xl p-px transition-transform duration-300 ${className}`}
      style={{
        background:
          'linear-gradient(150deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 40%, rgba(16,185,129,0.25) 100%)',
      }}
    >
      <div className="h-full rounded-[calc(1rem-0.5px)] bg-neutral-900/95 p-5 transition-colors duration-300 group-hover:bg-neutral-900">
        {children}
      </div>
    </div>
  )
}
