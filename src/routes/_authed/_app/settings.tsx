import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { PageHeader } from '@/components/ui/layout'
import { Badge, Button, Card, CardContent, CardHeader } from '@/components/ui/primitives'
import { Field, Input } from '@/components/ui/form'
import { updateWorkspaceFn } from '@/server/workspace'
import type { AppSession } from '@/server/session'

export const Route = createFileRoute('/_authed/_app/settings')({
  component: Settings,
})

function Settings() {
  const { session } = Route.useRouteContext() as { session: AppSession }
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    if (!name) return

    setBusy(true)
    setSaved(false)
    const result = await updateWorkspaceFn({ data: { name } })
    setBusy(false)
    if (result.ok) {
      setSaved(true)
      await router.invalidate()
    }
  }

  return (
    <>
      <PageHeader title="Settings" description="Workspace identity and account details." />

      <div className="max-w-2xl space-y-4 p-6">
        <Card>
          <CardHeader title="Workspace" description="Shown in the sidebar and on shared scorecards." />
          <CardContent>
            <form onSubmit={save} className="space-y-3">
              <Field label="Name" htmlFor="workspace-name">
                <Input id="workspace-name" name="name" defaultValue={session.workspace.name} required />
              </Field>
              <Field label="Slug" htmlFor="workspace-slug" hint="Used in URLs. Contact support to change it.">
                <Input id="workspace-slug" value={session.workspace.slug} readOnly disabled />
              </Field>
              <div className="flex items-center gap-3">
                <Button variant="primary" type="submit" disabled={busy}>
                  {busy ? 'Saving…' : 'Save changes'}
                </Button>
                {saved && <span className="text-2xs text-ok">Saved</span>}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Account" />
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-subtle">Email</span>
              <span className="text-ink">{session.user.email}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-subtle">Role</span>
              <Badge tone="neutral">{session.user.role}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-subtle">Workspace status</span>
              <Badge tone={session.workspace.onboarded ? 'ok' : 'warn'}>
                {session.workspace.onboarded ? 'Onboarded' : 'Setup incomplete'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Danger zone" description="Deleting a workspace removes every run it owns." />
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-2xs text-ink-muted">
              Deletion is not available during the beta. Ask support to remove a workspace.
            </p>
            <Button variant="danger" size="sm" disabled>
              Delete workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
