import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { PageHeader } from '@/components/ui/layout'
import { Badge, Button, Card, EmptyState, IconButton } from '@/components/ui/primitives'
import { ConfirmDialog, Dialog } from '@/components/ui/dialog'
import { Field, Input, Select } from '@/components/ui/form'
import { CodeBlock } from '@/components/ui/code'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { KeyIcon, PlusIcon, TrashIcon } from '@/components/ui/icons'
import { createKeyFn, listKeysFn, revokeKeyFn, type ApiKeyRow } from '@/server/keys'
import { listProjectsFn } from '@/server/projects'

export const Route = createFileRoute('/_authed/_app/api-keys')({
  loader: async () => {
    const [keys, projects] = await Promise.all([listKeysFn(), listProjectsFn()])
    return { keys, projects }
  },
  component: ApiKeys,
})

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATE_TONE = { active: 'ok', expired: 'warn', revoked: 'neutral' } as const

function ApiKeys() {
  const { keys, projects } = Route.useLoaderData()
  const router = useRouter()

  const [createOpen, setCreateOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<ApiKeyRow | null>(null)

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError(null)

    const projectId = String(form.get('projectId') ?? '')
    const result = await createKeyFn({
      data: {
        name: String(form.get('name') ?? '').trim(),
        expiresInDays: Number(form.get('expiresInDays') ?? 90) as 0 | 30 | 90 | 365,
        ...(projectId ? { projectId } : {}),
      },
    })

    setBusy(false)
    if (!result.ok) {
      setError(result.error === 'unauthenticated' ? 'Session expired — sign in again.' : 'Could not create the key.')
      return
    }

    setCreateOpen(false)
    setRevealed(result.plaintext)
    await router.invalidate()
  }

  async function revoke() {
    if (!revoking) return
    setBusy(true)
    await revokeKeyFn({ data: { id: revoking.id } })
    setBusy(false)
    setRevoking(null)
    await router.invalidate()
  }

  return (
    <>
      <PageHeader
        title="API keys"
        description="Meerkat generates the key; you copy it once. Only a SHA-256 hash and a public prefix are stored."
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            <PlusIcon width={14} height={14} /> Create key
          </Button>
        }
      />

      <div className="space-y-4 p-6">
        <Card>
          {keys.length === 0 ? (
            <EmptyState
              icon={<KeyIcon />}
              title="No API keys"
              description="Create a key to let your CI ingest runs. Keys can be scoped to one project and expire automatically."
              action={
                <Button variant="primary" onClick={() => setCreateOpen(true)}>
                  Create your first key
                </Button>
              }
            />
          ) : (
            <Table caption="API keys in this workspace">
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Key</TH>
                  <TH>Project</TH>
                  <TH>Scopes</TH>
                  <TH>Created</TH>
                  <TH>Last used</TH>
                  <TH>Expires</TH>
                  <TH>State</TH>
                  <TH />
                </TR>
              </THead>
              <TBody>
                {keys.map((key) => (
                  <TR key={key.id}>
                    <TD className="text-ink">{key.name}</TD>
                    <TD className="font-mono text-2xs">{key.prefix}••••</TD>
                    <TD className="text-2xs">{key.projectName ?? 'All projects'}</TD>
                    <TD className="text-2xs">{key.scopes.join(', ')}</TD>
                    <TD className="text-2xs">{formatDate(key.createdAt)}</TD>
                    <TD className="text-2xs">{formatDate(key.lastUsedAt)}</TD>
                    <TD className="text-2xs">{key.expiresAt ? formatDate(key.expiresAt) : 'Never'}</TD>
                    <TD>
                      <Badge tone={STATE_TONE[key.state]}>{key.state}</Badge>
                    </TD>
                    <TD align="right">
                      {key.state === 'active' && (
                        <IconButton label={`Revoke ${key.name}`} onClick={() => setRevoking(key)}>
                          <TrashIcon width={14} height={14} />
                        </IconButton>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        <p className="text-2xs text-ink-subtle">
          Use the key as <code className="font-mono text-ink-muted">Authorization: Bearer …</code> when
          posting to <code className="font-mono text-ink-muted">/api/runs</code>.
        </p>
      </div>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create API key"
        description="The secret is shown once and never again."
        footer={
          <>
            <Button onClick={() => setCreateOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="new-key" disabled={busy}>
              {busy ? 'Creating…' : 'Create key'}
            </Button>
          </>
        }
      >
        <form id="new-key" onSubmit={create} className="space-y-3">
          <Field label="Name" required htmlFor="key-name" hint="Where will this key live?">
            <Input id="key-name" name="name" required placeholder="GitHub Actions · acme-api" autoFocus />
          </Field>
          <Field label="Project" htmlFor="key-project" hint="Optional — an unscoped key can ingest any project in this workspace.">
            <Select id="key-project" name="projectId" defaultValue="">
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Expires" htmlFor="key-expiry">
            <Select id="key-expiry" name="expiresInDays" defaultValue="90">
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
              <option value="0">Never</option>
            </Select>
          </Field>
          {error && <p className="text-2xs text-danger">{error}</p>}
        </form>
      </Dialog>

      <Dialog
        open={revealed !== null}
        onClose={() => setRevealed(null)}
        title="Copy your key now"
        description="This is the only time the full key is visible. Store it as a CI secret."
        footer={
          <Button variant="primary" onClick={() => setRevealed(null)}>
            I copied it
          </Button>
        }
      >
        <CodeBlock code={revealed ?? ''} language="api key" />
        <p className="mt-2 text-2xs text-ink-subtle">
          If you lose it, revoke it and create a new one. Meerkat cannot recover it.
        </p>
      </Dialog>

      <ConfirmDialog
        open={revoking !== null}
        onClose={() => setRevoking(null)}
        onConfirm={revoke}
        busy={busy}
        title={`Revoke ${revoking?.name ?? 'key'}?`}
        description="Requests using this key start failing immediately. This cannot be undone."
        confirmLabel="Revoke key"
      />
    </>
  )
}
