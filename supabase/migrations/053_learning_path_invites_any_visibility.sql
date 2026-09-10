-- name: 053_learning_path_invites_any_visibility
-- =============================================================================
-- Allow owner invites + invitee outline edits on public and collaborative paths
-- (not only private). Title / goal / summary / visibility stay owner-only.
-- =============================================================================

drop policy if exists "Owners can insert path invites"
  on public.learning_path_invites;
create policy "Owners can insert path invites"
  on public.learning_path_invites for insert
  with check (
    invited_by = auth.uid()
    and invited_user_id is distinct from auth.uid()
    and exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and p.owner_id = auth.uid()
        and p.is_catalog = false
    )
  );

drop policy if exists "Private invitees can update learning path data"
  on public.learning_paths;
drop policy if exists "Invitees can update learning path data"
  on public.learning_paths;
create policy "Invitees can update learning path data"
  on public.learning_paths for update
  using (
    auth.uid() is not null
    and is_catalog = false
    and public.is_learning_path_invitee(id)
  )
  with check (
    auth.uid() is not null
    and is_catalog = false
    and public.is_learning_path_invitee(id)
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
    if not (
      old.is_catalog = false
      and public.is_learning_path_invitee(old.id)
    ) then
      raise exception 'Only the owner can change the learning path outline';
    end if;
  end if;
  return new;
end;
$$;
