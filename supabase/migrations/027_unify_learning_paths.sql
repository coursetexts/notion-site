-- name: 027_unify_learning_paths
-- =============================================================================
-- Course syllabi become learning_paths rows (kind = course). Add visibility
-- (private | public | collaborative). Copy pins/notes after stub course rows.
-- Does not DROP curated_* tables.
-- Does not move official Notion courses onto learning_paths (future work).
-- =============================================================================

alter table public.learning_paths
  drop constraint if exists learning_paths_kind_ck;

alter table public.learning_paths
  add constraint learning_paths_kind_ck
  check (kind in ('community', 'research', 'course'));

alter table public.learning_paths
  add column if not exists visibility text;

update public.learning_paths
  set visibility = case
    when is_catalog = true then 'public'
    when coalesce(is_private, true) then 'private'
    else 'public'
  end
  where visibility is null;

alter table public.learning_paths
  alter column visibility set default 'private';

alter table public.learning_paths
  alter column visibility set not null;

alter table public.learning_paths
  drop constraint if exists learning_paths_visibility_ck;

alter table public.learning_paths
  add constraint learning_paths_visibility_ck
  check (visibility in ('private', 'public', 'collaborative'));

update public.learning_paths
  set visibility = 'public',
      is_private = false
  where is_catalog = true;

create or replace function public.sync_learning_path_is_private()
returns trigger
language plpgsql
as $$
begin
  new.is_private := (new.visibility = 'private');
  return new;
end;
$$;

drop trigger if exists learning_paths_sync_is_private on public.learning_paths;
create trigger learning_paths_sync_is_private
  before insert or update of visibility, is_private
  on public.learning_paths
  for each row
  execute function public.sync_learning_path_is_private();

drop policy if exists "Anyone can read catalog learning paths"
  on public.learning_paths;
drop policy if exists "Anyone can read public learning paths"
  on public.learning_paths;
create policy "Anyone can read public learning paths"
  on public.learning_paths for select
  using (
    is_catalog = true
    or visibility in ('public', 'collaborative')
  );

drop policy if exists "Collaborators can update shared learning path data"
  on public.learning_paths;
create policy "Collaborators can update shared learning path data"
  on public.learning_paths for update
  using (
    auth.uid() is not null
    and (
      visibility = 'collaborative'
      or (kind = 'course' and is_catalog = true)
    )
  )
  with check (
    auth.uid() is not null
    and (
      visibility = 'collaborative'
      or (kind = 'course' and is_catalog = true)
    )
  );

create or replace function public.learning_paths_collaborator_guard()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.owner_id is not null and new.owner_id = auth.uid() then
    return new;
  end if;
  if old.slug is distinct from new.slug
     or old.owner_id is distinct from new.owner_id
     or old.is_catalog is distinct from new.is_catalog
     or old.kind is distinct from new.kind
     or old.visibility is distinct from new.visibility
     or old.title is distinct from new.title
     or old.goal is distinct from new.goal
     or old.summary is distinct from new.summary then
    raise exception 'Only the owner can change learning path metadata';
  end if;
  return new;
end;
$$;

drop trigger if exists learning_paths_collaborator_guard on public.learning_paths;
create trigger learning_paths_collaborator_guard
  before update on public.learning_paths
  for each row
  execute function public.learning_paths_collaborator_guard();

drop index if exists public.learning_paths_public_research_goal_idx;
create index if not exists learning_paths_public_research_goal_idx
  on public.learning_paths (goal, updated_at desc)
  where kind = 'research' and visibility = 'public';

create index if not exists learning_paths_catalog_kind_idx
  on public.learning_paths (kind, created_at asc)
  where is_catalog;

create table if not exists public.learning_path_pins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  path_id uuid not null references public.learning_paths (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, path_id)
);

create index if not exists learning_path_pins_user_idx
  on public.learning_path_pins (user_id, created_at desc);

alter table public.learning_path_pins enable row level security;

drop policy if exists "Users can read own learning path pins"
  on public.learning_path_pins;
create policy "Users can read own learning path pins"
  on public.learning_path_pins for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own learning path pins"
  on public.learning_path_pins;
create policy "Users can insert own learning path pins"
  on public.learning_path_pins for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own learning path pins"
  on public.learning_path_pins;
create policy "Users can delete own learning path pins"
  on public.learning_path_pins for delete
  using (auth.uid() = user_id);

-- Stub course catalog rows so notes/pins can copy before the JSON backfill script.
do $$
begin
  if to_regclass('public.curated_courses') is null then
    return;
  end if;

  insert into public.learning_paths (
    slug, owner_id, title, goal, summary, data,
    is_catalog, is_private, kind, visibility, created_at, updated_at
  )
  select
    c.slug,
    null,
    c.title,
    c.title,
    coalesce(c.description, ''),
    jsonb_build_object(
      'id', c.id,
      'slug', c.slug,
      'title', c.title,
      'description', coalesce(c.description, ''),
      'topics', '[]'::jsonb,
      'dbBacked', true
    ),
    true,
    false,
    'course',
    'public',
    c.created_at,
    now()
  from public.curated_courses c
  where not exists (
    select 1 from public.learning_paths lp where lp.slug = c.slug
  );

  if to_regclass('public.curated_course_notes') is not null
     and to_regclass('public.curated_course_nodes') is not null then
    insert into public.learning_path_user_state (
      user_id, path_id, notes, resources, node_status, updated_at
    )
    select
      mapped.user_id,
      mapped.path_id,
      jsonb_object_agg(mapped.node_id, mapped.content),
      '{}'::jsonb,
      '{}'::jsonb,
      now()
    from (
      select n.user_id, lp.id as path_id, n.node_id, n.content
      from public.curated_course_notes n
      join public.learning_paths lp
        on lp.kind = 'course'
       and n.course_slug is not null
       and n.course_slug <> ''
       and lp.slug = n.course_slug
      union
      select n.user_id, lp.id as path_id, n.node_id, n.content
      from public.curated_course_notes n
      join public.curated_course_nodes cn
        on cn.id::text = n.node_id
      join public.curated_courses cc
        on cc.id = cn.course_id
      join public.learning_paths lp
        on lp.kind = 'course' and lp.slug = cc.slug
    ) mapped
    group by mapped.user_id, mapped.path_id
    on conflict (user_id, path_id) do update
      set notes = public.learning_path_user_state.notes || excluded.notes,
          updated_at = now();
  end if;

  if to_regclass('public.curated_course_pins') is not null then
    insert into public.learning_path_pins (user_id, path_id, created_at)
    select p.user_id, lp.id, p.created_at
    from public.curated_course_pins p
    join public.curated_courses cc on cc.id = p.course_id
    join public.learning_paths lp
      on lp.kind = 'course' and lp.slug = cc.slug
    on conflict (user_id, path_id) do nothing;
  end if;
end $$;
