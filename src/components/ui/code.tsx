// Code display + clipboard affordances used by onboarding and the MCP page.

import { useState } from 'react'

import { cn } from '@/lib/cn'
import { CheckIcon, CopyIcon } from './icons'

export function CopyButton({
  value,
  label = 'Copy',
  className,
}: {
  value: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Clipboard API is unavailable outside secure contexts; the value stays
      // selectable in the code block, which is the graceful fallback.
      return
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-raised px-2 py-1 text-2xs font-medium text-ink-muted transition-colors hover:border-line-strong hover:text-ink',
        className,
      )}
    >
      {copied ? <CheckIcon width={12} height={12} /> : <CopyIcon width={12} height={12} />}
      {copied ? 'Copied' : label}
    </button>
  )
}

export function CodeBlock({
  code,
  language,
  className,
  copyable = true,
}: {
  code: string
  language?: string
  className?: string
  copyable?: boolean
}) {
  return (
    <div className={cn('overflow-hidden rounded-md border border-line bg-canvas', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-1.5">
        <span className="text-2xs font-medium uppercase tracking-wider text-ink-subtle">
          {language ?? 'text'}
        </span>
        {copyable && <CopyButton value={code} />}
      </div>
      <pre className="overflow-x-auto px-3 py-3 text-xs leading-relaxed text-ink-muted">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  )
}
