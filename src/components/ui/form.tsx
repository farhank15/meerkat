// Form primitives. Labels are always associated; errors use aria-describedby.

import { useId } from 'react'

import { cn } from '@/lib/cn'

const control =
  'w-full rounded-md border border-line bg-canvas px-3 text-sm text-ink placeholder:text-ink-subtle transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 disabled:opacity-50'

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
  className,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  htmlFor?: string
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-ink-muted">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-2xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-2xs text-ink-subtle">{hint}</p>
      ) : null}
    </div>
  )
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, 'h-9', className)} {...props} />
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'py-2 leading-relaxed', className)} {...props} />
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(control, 'h-9 pr-8', className)} {...props}>
      {children}
    </select>
  )
}

export function Checkbox({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId()
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border-line bg-canvas accent-accent"
        {...props}
      />
      <label htmlFor={id} className="text-xs text-ink-muted">
        {label}
      </label>
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors disabled:opacity-50',
        checked ? 'border-accent/40 bg-accent/25' : 'border-line bg-surface-hover',
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 rounded-full transition-transform',
          checked ? 'translate-x-4.5 bg-accent' : 'translate-x-1 bg-ink-subtle',
        )}
      />
    </button>
  )
}
