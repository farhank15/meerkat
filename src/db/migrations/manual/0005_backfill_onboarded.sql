-- 0005_backfill_onboarded.sql — data-only follow-up to 0001.
--
-- A workspace that already owns a project has clearly been set up; marking it
-- onboarded keeps the sidebar badge honest for the existing account. The
-- showcase workspace also gets its product name instead of the generated one.

begin;

update workspaces w
set onboarded_at = coalesce(w.onboarded_at, now())
where exists (select 1 from projects p where p.workspace_id = w.id);

update workspaces w
set name = 'Meerkat'
where w.name like '% workspace'
  and exists (
    select 1 from projects p
    where p.workspace_id = w.id and p.slug = 'meerkat-demo'
  );

commit;
