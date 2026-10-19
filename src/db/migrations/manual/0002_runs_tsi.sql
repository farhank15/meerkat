-- 0002_runs_tsi.sql — normalize runs.tsi from jsonb to integer.
--
-- The stored payload keeps the full metric object in `data.metric`, so nothing
-- is lost. This file aborts before touching the column if any row holds a
-- non-numeric JSON value, which is the only case where a cast would silently
-- corrupt the ledger.

begin;

do $$
begin
  if exists (
    select 1 from runs
    where tsi is not null
      and jsonb_typeof(tsi) <> 'number'
  ) then
    raise exception 'runs.tsi contains non-numeric jsonb — inspect those rows before migrating';
  end if;
end $$;

-- numeric round-trip: a JSON number may be stored as 50.0, which does not cast
-- to integer directly.
alter table runs
  alter column tsi type integer
  using case
    when tsi is null then null
    else round((tsi::text)::numeric)::integer
  end;

commit;
