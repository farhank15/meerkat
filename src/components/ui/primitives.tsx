// Core visual primitives. Every product surface composes these; routes never
// hand-roll borders, radii or colors. Token names come from src/styles.css.

import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

// ── Button ──────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

const buttonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-strong',
  secondary: 'border border-line bg-surface-raised text-ink hover:border-line-strong hover:bg-surface-hover',
  ghost: 'text-ink-muted hover:bg-surface-hover hover:text-ink',
  danger: 'border border-danger/30 bg-danger-soft text-danger hover:border-danger/60',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-3.5 text-sm',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  return (
    <button
      type={type}
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  )
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// ── Badge ───────────────────────────────────────────────────────────────────

type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info' | 'accent'

const toneClasses: Record<Tone, string> = {
  neutral: 'border-line bg-surface-raised text-ink-muted',
  ok: 'border-ok/25 bg-ok/10 text-ok',
  warn: 'border-warn/25 bg-warn/10 text-warn',
  danger: 'border-danger/25 bg-danger/10 text-danger',
  info: 'border-info/25 bg-info/10 text-info',
  accent: 'border-accent/25 bg-accent/10 text-accent',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const RUN_STATUS_TONES: Record<string, Tone> = {
  complete: 'ok',
  incomplete: 'warn',
  'parse-error': 'danger',
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={RUN_STATUS_TONES[status] ?? 'neutral'}>{status}</Badge>
}

const VERDICT_TONES: Record<string, Tone> = {
  green: 'ok',
  red: 'danger',
  amber: 'warn',
  withheld: 'warn',
  unknown: 'neutral',
}

export function VerdictBadge({ state, label }: { state: string; label?: string | null }) {
  return <Badge tone={VERDICT_TONES[state] ?? 'neutral'}>{label ?? state}</Badge>
}

// ── Card ────────────────────────────────────────────────────────────────────

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn('surface rounded-lg shadow-panel', className)}>{children}</section>
  )
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-line px-4 py-3', className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('px-4 py-3', className)}>{children}</div>
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 border-t border-line px-4 py-2.5', className)}>
      {children}
    </div>
  )
}

// ── Alert ───────────────────────────────────────────────────────────────────

export function Alert({
  tone = 'neutral',
  title,
  children,
  className,
}: {
  tone?: Tone
  title?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const surface: Record<Tone, string> = {
    neutral: 'border-line bg-surface text-ink-muted',
    ok: 'border-ok/25 bg-ok/5 text-ink-muted',
    warn: 'border-warn/25 bg-warn/5 text-ink-muted',
    danger: 'border-danger/25 bg-danger/5 text-ink-muted',
    info: 'border-info/25 bg-info/5 text-ink-muted',
    accent: 'border-accent/25 bg-accent/5 text-ink-muted',
  }
  return (
    <div className={cn('rounded-md border px-3.5 py-3 text-xs leading-relaxed', surface[tone], className)}>
      {title && <p className="mb-1 text-sm font-medium text-ink">{title}</p>}
      {children}
    </div>
  )
}

// ── Empty state ─────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface-raised text-ink-subtle">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs leading-relaxed text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── Skeleton ────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-surface-hover', className)} />
}

// ── Stat ────────────────────────────────────────────────────────────────────

export function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'neutral' | 'ok' | 'warn' | 'danger'
}) {
  const valueTone =
    tone === 'ok' ? 'text-ok' : tone === 'warn' ? 'text-warn' : tone === 'danger' ? 'text-danger' : 'text-ink'
  return (
    <div className="surface rounded-lg px-4 py-3">
      <div className="text-2xs font-medium uppercase tracking-wider text-ink-subtle">{label}</div>
      <div className={cn('mono-nums mt-1.5 text-2xl font-semibold tracking-tight', valueTone)}>{value}</div>
      {hint && <div className="mt-0.5 text-2xs text-ink-subtle">{hint}</div>}
    </div>
  )
}

// ── Avatar ──────────────────────────────────────────────────────────────────

export function Avatar({ name, src, size = 28 }: { name: string; src?: string | null; size?: number }) {
  const initial = (name || '?').slice(0, 1).toUpperCase()
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-raised text-2xs font-semibold text-ink-muted"
      style={{ width: size, height: size }}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initial}
    </span>
  )
}

// ── Spinner ─────────────────────────────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-accent',
        className,
      )}
    />
  )
}

export function Separator({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-line', className)} />
}
