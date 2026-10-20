-- 0001_tenancy.sql — additive only. Safe on a live database.
--
-- Introduces the tenancy spine (workspaces + users.workspace_id) without any
-- NOT NULL or destructive change, so the previous application deployment keeps
-- working after this runs. Constraints land in 0003 once the new code is live.
--
-- Backfill rules:
--   * every legacy user gets a workspace whose id equals the user id
--   * every legacy project is attached to the demo user's workspace
--   * orphan API keys are revoked, never deleted

begin;

create extension if not exists pgcrypto;

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

alter table users add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table users add column if not exists name text;
alter table users add column if not exists avatar_url text;
alter table users add column if not exists role text not null default 'owner';
alter table users add column if not exists last_login_at timestamptz;

alter table projects add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table projects add column if not exists is_public boolean not null default false;
alter table projects add column if not exists badge_enabled boolean not null default true;
alter table projects add column if not exists provider text not null default 'github';
alter table projects add column if not exists default_branch text;
alter table projects add column if not exists updated_at timestamptz not null default now();

alter table runs add column if not exists started_at timestamptz;
alter table runs add column if not exists dedupe_key text;

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  created_by_user_id uuid references users(id) on delete set null,
  name text not null,
  prefix text not null,
  key_hash text not null,
  scopes text[] not null default array['ingest', 'read']::text[],
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table api_keys add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table api_keys add column if not exists project_id uuid references projects(id) on delete set null;
alter table api_keys add column if not exists created_by_user_id uuid references users(id) on delete set null;
alter table api_keys add column if not exists scopes text[] not null default array['ingest', 'read']::text[];
alter table api_keys add column if not exists last_used_at timestamptz;
alter table api_keys add column if not exists revoked_at timestamptz;

-- ── Backfill: one workspace per legacy user ────────────────────────────────
insert into workspaces (id, name, slug)
select
  u.id,
  coalesce(nullif(split_part(u.email, '@', 1), ''), 'Workspace') || ' workspace',
  'ws-' || left(replace(u.id::text, '-', ''), 12)
from users u
where u.workspace_id is null
on conflict do nothing;

update users u
set workspace_id = u.id
where u.workspace_id is null
  and exists (select 1 from workspaces w where w.id = u.id);

-- Last resort for users whose id collided with an existing workspace row.
update users
set workspace_id = (select id from workspaces order by created_at limit 1)
where workspace_id is null
  and exists (select 1 from workspaces);

-- ── Backfill: legacy projects belong to the demo workspace ─────────────────
do $$
declare
  target uuid;
begin
  if exists (select 1 from projects where workspace_id is null) then
    if not exists (select 1 from workspaces) then
      insert into workspaces (name, slug) values ('Meerkat', 'meerkat-demo');
    end if;

    select coalesce(
      (select workspace_id from users where email = 'demo@suitevitals.dev' limit 1),
      (select id from workspaces order by created_at limit 1)
    ) into target;

    update projects set workspace_id = target where workspace_id is null;
  end if;
end $$;

update projects set is_public = true where slug = 'meerkat-demo';

-- ── Backfill: API keys ─────────────────────────────────────────────────────
update api_keys
set revoked_at = now()
where user_id is null
  and workspace_id is null
  and revoked_at is null;

update api_keys k
set workspace_id = u.workspace_id
from users u
where k.user_id = u.id
  and k.workspace_id is null;

update api_keys
set workspace_id = (select id from workspaces order by created_at limit 1)
where workspace_id is null
  and exists (select 1 from workspaces);

update api_keys
set created_by_user_id = user_id
where created_by_user_id is null;

-- ── Backfill: runs.started_at from the stored payload ──────────────────────
-- pg_input_is_valid exists on PG16+. The regex branch is the fallback; both
-- are no-ops for rows that do not carry a parseable timestamp.
do $$
begin
  if exists (select 1 from pg_proc where proname = 'pg_input_is_valid') then
    execute $sql$
      update runs
      set started_at = (data->>'startedAt')::timestamptz
      where started_at is null
        and data ? 'startedAt'
        and pg_input_is_valid(data->>'startedAt', 'timestamptz')
    $sql$;
  else
    execute $sql$
      update runs
      set started_at = (data->>'startedAt')::timestamptz
      where started_at is null
        and data ? 'startedAt'
        and (data->>'startedAt') ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}'
    $sql$;
  end if;
end $$;

-- ── Indexes ────────────────────────────────────────────────────────────────
create index if not exists users_workspace_idx on users (workspace_id);
create index if not exists projects_workspace_idx on projects (workspace_id);
create index if not exists runs_project_created_idx on runs (project_id, created_at desc);
create index if not exists runs_project_started_idx on runs (project_id, started_at desc nulls last);
create index if not exists runs_project_sha_idx on runs (project_id, sha);
create unique index if not exists runs_project_dedupe_uq
  on runs (project_id, dedupe_key) where dedupe_key is not null;
create unique index if not exists api_keys_prefix_uq on api_keys (prefix);
create unique index if not exists api_keys_hash_uq on api_keys (key_hash);
create index if not exists api_keys_workspace_idx
  on api_keys (workspace_id) where revoked_at is null;

commit;
