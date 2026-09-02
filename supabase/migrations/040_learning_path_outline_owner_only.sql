-- name: 040_learning_path_outline_owner_only
-- =============================================================================
-- Community / research path outlines (nodes, edges, why) are owner-only.
-- Signed-in users may still patch catalog course syllabus JSON (resources).
-- Collaborative visibility no longer grants UPDATE on learning_paths.data.
-- =============================================================================

drop policy if exists "Collaborators can update shared learning path data"
  on public.learning_paths;
create policy "Collaborators can update shared learning path data"
  on public.learning_paths for update
  using (
    auth.uid() is not null
    and kind = 'course'
    and is_catalog = true
  )
  with check (
    auth.uid() is not null
    and kind = 'course'
    and is_catalog = true
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
  if old.data is distinct from new.data
     and not (old.kind = 'course' and old.is_catalog = true) then
    raise exception 'Only the owner can change the learning path outline';
  end if;
  return new;
end;
$$;
