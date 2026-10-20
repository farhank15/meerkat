-- 0003_constraints.sql — non-blocking integrity checks.
--
-- Only CHECK constraints live here: they do not break the previous deployment,
-- which still inserts rows without a workspace. The NOT NULL tightening is
-- deferred to 0004 so it lands together with the tenancy-aware code.

begin;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_role_chk'
  ) then
    alter table users add constraint users_role_chk check (role in ('owner', 'member'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'api_keys_scopes_chk'
  ) then
    alter table api_keys add constraint api_keys_scopes_chk
      check (scopes <@ array['ingest', 'read']::text[]);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'projects_provider_chk'
  ) then
    alter table projects add constraint projects_provider_chk
      check (provider in ('github', 'generic'));
  end if;
end $$;

commit;
