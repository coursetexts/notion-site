-- name: 029_learning_path_is_filled
-- =============================================================================
-- Course syllabi that have a real topic tree vs title-only catalog stubs.
-- `is_filled` is derived from data.topics (at least one topic with children).
-- All Courses lists only kind=course rows where is_filled is true.
-- =============================================================================

alter table public.learning_paths
  add column if not exists is_filled boolean not null default false;

create or replace function public.sync_learning_path_is_filled()
returns trigger
language plpgsql
as $$
begin
  if new.kind = 'course'
     and jsonb_typeof(coalesce(new.data, '{}'::jsonb)->'topics') = 'array'
     and jsonb_array_length(new.data->'topics') > 0
     and exists (
       select 1
       from jsonb_array_elements(new.data->'topics') as topic
       where jsonb_typeof(topic->'children') = 'array'
         and jsonb_array_length(topic->'children') > 0
     )
  then
    new.is_filled := true;
  else
    new.is_filled := false;
  end if;
  return new;
end;
$$;

drop trigger if exists learning_paths_sync_is_filled on public.learning_paths;
create trigger learning_paths_sync_is_filled
  before insert or update of data, kind, is_filled
  on public.learning_paths
  for each row
  execute function public.sync_learning_path_is_filled();

update public.learning_paths
set is_filled = (
  kind = 'course'
  and jsonb_typeof(coalesce(data, '{}'::jsonb)->'topics') = 'array'
  and jsonb_array_length(data->'topics') > 0
  and exists (
    select 1
    from jsonb_array_elements(data->'topics') as topic
    where jsonb_typeof(topic->'children') = 'array'
      and jsonb_array_length(topic->'children') > 0
  )
);

create index if not exists learning_paths_course_filled_idx
  on public.learning_paths (title)
  where kind = 'course' and is_filled = true;
