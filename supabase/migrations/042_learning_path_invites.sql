-- name: 042_learning_path_invites
-- =============================================================================
-- Private learning-path collaborators: owner invites an existing Coursetexts
-- account by email. No invitation email is sent. Access is the signed-in
-- user's email (or user id captured at invite time) matching the invite row.
-- Invitees may read the private path and edit its outline/resources (`data`)
-- while visibility stays private. Metadata (title, goal, summary, visibility)
-- remains owner-only.
-- =============================================================================

create table if not exists public.learning_path_invites (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.learning_paths (id) on delete cascade,
  invited_email text not null,
  invited_user_id uuid references auth.users (id) on delete cascade,
  invited_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint learning_path_invites_email_ck check (
    invited_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint learning_path_invites_not_self_ck check (
    invited_user_id is distinct from invited_by
  ),
  unique (path_id, invited_email)
);

create index if not exists learning_path_invites_path_idx
  on public.learning_path_invites (path_id);

create index if not exists learning_path_invites_email_idx
  on public.learning_path_invites (invited_email);

create index if not exists learning_path_invites_user_idx
  on public.learning_path_invites (invited_user_id)
  where invited_user_id is not null;

create or replace function public.learning_path_invites_normalize()
returns trigger
language plpgsql
as $$
begin
  new.invited_email := lower(trim(new.invited_email));
  return new;
end;
$$;

drop trigger if exists learning_path_invites_normalize on public.learning_path_invites;
create trigger learning_path_invites_normalize
  before insert or update of invited_email
  on public.learning_path_invites
  for each row
  execute function public.learning_path_invites_normalize();

create or replace function public.is_learning_path_invitee(p_path_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.learning_path_invites i
    where i.path_id = p_path_id
      and auth.uid() is not null
      and (
        i.invited_user_id = auth.uid()
        or (
          coalesce(auth.jwt() ->> 'email', '') <> ''
          and i.invited_email = lower(trim(auth.jwt() ->> 'email'))
        )
      )
  );
$$;

revoke all on function public.is_learning_path_invitee(uuid) from public;
grant execute on function public.is_learning_path_invitee(uuid) to authenticated, anon;

create or replace function public.learning_path_owner_overlay_resources(p_path_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return '{}'::jsonb;
  end if;
  if not exists (
    select 1
    from public.learning_paths p
    where p.id = p_path_id
      and (
        p.owner_id = auth.uid()
        or public.is_learning_path_invitee(p_path_id)
      )
  ) then
    return '{}'::jsonb;
  end if;
  return coalesce(
    (
      select s.resources
      from public.learning_paths p
      join public.learning_path_user_state s
        on s.path_id = p.id
       and s.user_id = p.owner_id
      where p.id = p_path_id
    ),
    '{}'::jsonb
  );
end;
$$;

revoke all on function public.learning_path_owner_overlay_resources(uuid) from public;
grant execute on function public.learning_path_owner_overlay_resources(uuid) to authenticated;

alter table public.learning_path_invites enable row level security;

drop policy if exists "Owners can read path invites"
  on public.learning_path_invites;
create policy "Owners can read path invites"
  on public.learning_path_invites for select
  using (
    exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Invitees can read own invite"
  on public.learning_path_invites;
create policy "Invitees can read own invite"
  on public.learning_path_invites for select
  using (
    invited_user_id = auth.uid()
    or (
      coalesce(auth.jwt() ->> 'email', '') <> ''
      and invited_email = lower(trim(auth.jwt() ->> 'email'))
    )
  );

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
        and p.visibility = 'private'
    )
  );

drop policy if exists "Owners can delete path invites"
  on public.learning_path_invites;
create policy "Owners can delete path invites"
  on public.learning_path_invites for delete
  using (
    exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Invitees can read invited learning paths"
  on public.learning_paths;
create policy "Invitees can read invited learning paths"
  on public.learning_paths for select
  using (public.is_learning_path_invitee(id));

drop policy if exists "Private invitees can update learning path data"
  on public.learning_paths;
create policy "Private invitees can update learning path data"
  on public.learning_paths for update
  using (
    auth.uid() is not null
    and visibility = 'private'
    and is_catalog = false
    and public.is_learning_path_invitee(id)
  )
  with check (
    auth.uid() is not null
    and visibility = 'private'
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
      old.visibility = 'private'
      and old.is_catalog = false
      and public.is_learning_path_invitee(old.id)
    )     then
      raise exception 'Only the owner can change the learning path outline';
    end if;
  end if;
  return new;
end;
$$;

-- Probe whether a slug exists without returning path contents (see also 043).
create or replace function public.learning_path_public_access(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  rec record;
begin
  if p_slug is null or length(trim(p_slug)) = 0 then
    return jsonb_build_object(
      'exists', false,
      'accessible', false,
      'visibility', null
    );
  end if;

  select
    lp.id,
    lp.visibility,
    lp.is_catalog,
    lp.owner_id
  into rec
  from public.learning_paths lp
  where lp.slug = trim(p_slug)
  limit 1;

  if not found then
    return jsonb_build_object(
      'exists', false,
      'accessible', false,
      'visibility', null
    );
  end if;

  if rec.is_catalog
     or rec.visibility in ('public', 'collaborative')
     or rec.owner_id = auth.uid()
     or public.is_learning_path_invitee(rec.id) then
    return jsonb_build_object(
      'exists', true,
      'accessible', true,
      'visibility', rec.visibility
    );
  end if;

  return jsonb_build_object(
    'exists', true,
    'accessible', false,
    'visibility', rec.visibility
  );
end;
$$;

revoke all on function public.learning_path_public_access(text) from public;
grant execute on function public.learning_path_public_access(text) to anon, authenticated;
