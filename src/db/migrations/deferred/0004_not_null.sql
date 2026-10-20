-- 0004_not_null.sql — tighten the tenancy spine.
--
-- Apply ONLY after the tenancy-aware application code is deployed and verified:
-- every writer must set workspace_id before this runs. Until then the columns
-- stay nullable so a rollback to the previous deployment remains safe.

begin;

alter table users alter column workspace_id set not null;
alter table projects alter column workspace_id set not null;
alter table api_keys alter column workspace_id set not null;

commit;
