// Table primitives. Rows are never clickable containers with nested links —
// the first cell carries the link, which keeps keyboard navigation predictable.

import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

export function Table({
  children,
  className,
  caption,
}: {
  children: ReactNode
  className?: string
  caption?: string
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full min-w-[640px] border-collapse text-sm', className)}>
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-line">{children}</thead>
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>
}

export function TR({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string } & React.TableHTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('transition-colors hover:bg-surface-hover/50', className)} {...rest}>
      {children}
    </tr>
  )
}

export function TH({
  children,
  className,
  align = 'left',
  scope = 'col',
}: {
  children?: ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
  scope?: 'col' | 'row'
}) {
  return (
    <th
      scope={scope}
      className={cn(
        'px-4 py-2 text-2xs font-medium uppercase tracking-wider text-ink-subtle',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function TD({
  children,
  className,
  align = 'left',
  colSpan,
}: {
  children?: ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
  colSpan?: number
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        'px-4 py-2.5 text-ink-muted',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </td>
  )
}
