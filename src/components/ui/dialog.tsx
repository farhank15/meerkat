// Native <dialog> wrapper — focus trapping, Escape and the top layer come from
// the platform, so there is no custom keyboard handling to get wrong.
//
// Tailwind's preflight resets `margin` to 0 on every element, which also wipes
// the UA `margin: auto` that centers a modal dialog. `m-auto` + `inset-0` puts
// the centering back explicitly; without them the panel sticks to a corner.

import { useEffect, useId, useRef } from 'react'

import { cn } from '@/lib/cn'
import { IconButton, Button } from './primitives'
import { CloseIcon } from './icons'

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      className={cn(
        'inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain',
        'rounded-lg border border-line bg-surface p-0 text-ink shadow-pop backdrop:bg-black/70',
        size === 'sm' && 'max-w-sm',
        size === 'md' && 'max-w-lg',
        size === 'lg' && 'max-w-2xl',
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h2 id={titleId} className="text-sm font-semibold text-ink">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="mt-0.5 text-xs text-ink-muted">
              {description}
            </p>
          )}
        </div>
        <IconButton label="Close dialog" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>
      {children && <div className="px-4 py-4">{children}</div>}
      {footer && (
        <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">{footer}</div>
      )}
    </dialog>
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  busy,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  busy?: boolean
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    />
  )
}
