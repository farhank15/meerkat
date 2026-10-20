import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'

import { PageHeader } from '@/components/ui/layout'
import { Badge, Button, Card, EmptyState } from '@/components/ui/primitives'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/form'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { FolderIcon, PlusIcon } from '@/components/ui/icons'
import { createProjectFn, listProjectsFn } from '@/server/projects'

export const Route = createFileRoute('/_authed/_app/projects/')({
  loader: () => listProjectsFn(),
  component: Projects,
})

function Projects() {
  const projects = Route.useLoaderData()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError(null)

    const result = await createProjectFn({
      data: {
        name: String(form.get('name') ?? '').trim(),
        repoUrl: String(form.get('repoUrl') ?? '').trim(),
        isPublic: form.get('isPublic') === 'on',
      },
    })

    setBusy(false)
    if (!result.ok) {
      setError(result.error === 'unauthenticated' ? 'Session expired — sign in again.' : 'Could not create the project.')
      return
    }
    setOpen(false)
    await router.invalidate()
  }

  return (
    <>
      <PageHeader
        title="Projects"
        description="One project per repository. Runs, keys and the public scorecard all hang off a project."
        actions={
          <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
            <PlusIcon width={14} height={14} /> New project
          </Button>
        }
      />

      <div className="p-6">
        <Card>
          {projects.length === 0 ? (
            <EmptyState
              icon={<FolderIcon />}
              title="No projects yet"
              description="Create a project for the repository you want scored. You can make it public later — that only affects read access, never the data."
              action={
                <Button variant="primary" onClick={() => setOpen(true)}>
                  Create project
                </Button>
              }
            />
          ) : (
            <Table caption="Projects in this workspace">
              <THead>
                <TR>
                  <TH>Project</TH>
                  <TH>Repository</TH>
                  <TH>Visibility</TH>
                  <TH align="right">Runs</TH>
                  <TH align="right">Latest TSI</TH>
                  <TH />
                </TR>
              </THead>
              <TBody>
                {projects.map((project) => (
                  <TR key={project.id}>
                    <TD>
                      <div className="text-xs font-medium text-ink">{project.name}</div>
                      <div className="font-mono text-2xs text-ink-subtle">{project.slug}</div>
                    </TD>
                    <TD className="max-w-[240px] truncate text-2xs">
                      {project.repoUrl ? (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-ink"
                        >
                          {project.repoUrl.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        '—'
                      )}
                    </TD>
                    <TD>
                      <Badge tone={project.isPublic ? 'accent' : 'neutral'}>
                        {project.isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </TD>
                    <TD align="right" className="mono-nums">
                      {project.runCount}
                    </TD>
                    <TD align="right" className="mono-nums text-ink">
                      {project.latestTsi ?? '—'}
                    </TD>
                    <TD align="right">
                      <Link
                        to="/runs"
                        className="text-2xs font-medium text-accent hover:text-accent-strong"
                      >
                        View runs
                      </Link>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="New project"
        description="The slug becomes the public scorecard URL."
        footer={
          <>
            <Button onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="new-project" disabled={busy}>
              {busy ? 'Creating…' : 'Create project'}
            </Button>
          </>
        }
      >
        <form id="new-project" onSubmit={submit} className="space-y-3">
          <Field label="Name" required htmlFor="project-name">
            <Input id="project-name" name="name" required placeholder="acme-api" autoFocus />
          </Field>
          <Field
            label="Repository URL"
            htmlFor="project-repo"
            hint="Optional now — needed for commit links."
          >
            <Input id="project-repo" name="repoUrl" type="url" placeholder="https://github.com/acme/api" />
          </Field>
          <label className="flex items-start gap-2 text-xs text-ink-muted">
            <input type="checkbox" name="isPublic" className="mt-0.5 h-4 w-4 accent-accent" />
            <span>
              Public scorecard — anyone with the link can read the latest verdict. No writes.
            </span>
          </label>
          {error && <p className="text-2xs text-danger">{error}</p>}
        </form>
      </Dialog>
    </>
  )
}
