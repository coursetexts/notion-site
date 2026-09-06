-- name: 044_learning_path_join_requests
-- =============================================================================
-- Signed-in users can request to join a private learning path. Their email is
-- stored. The owner sees pending requests on the path and in the profile feed.
-- Accepting creates a `learning_path_invites` row (same as Invite).
-- Requires 042 (`is_learning_path_invitee`) and 043 (`learning_path_public_access`).
-- =============================================================================

create table if not exists public.learning_path_join_requests (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.learning_paths (id) on delete cascade,
  requester_user_id uuid not null references auth.users (id) on delete cascade,
  requester_email text not null,
  created_at timestamptz not null default now(),
  constraint learning_path_join_requests_email_ck check (
    requester_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  unique (path_id, requester_user_id)
);

create index if not exists learning_path_join_requests_path_idx
  on public.learning_path_join_requests (path_id, created_at desc);

create index if not exists learning_path_join_requests_user_idx
  on public.learning_path_join_requests (requester_user_id);

create or replace function public.learning_path_join_requests_normalize()
returns trigger
language plpgsql
as $$
begin
  new.requester_email := lower(trim(new.requester_email));
  return new;
end;
$$;

drop trigger if exists learning_path_join_requests_normalize
  on public.learning_path_join_requests;
create trigger learning_path_join_requests_normalize
  before insert or update of requester_email
  on public.learning_path_join_requests
  for each row
  execute function public.learning_path_join_requests_normalize();

alter table public.learning_path_join_requests enable row level security;

drop policy if exists "Owners can read path join requests"
  on public.learning_path_join_requests;
create policy "Owners can read path join requests"
  on public.learning_path_join_requests for select
  using (
    exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Requesters can read own join requests"
  on public.learning_path_join_requests;
create policy "Requesters can read own join requests"
  on public.learning_path_join_requests for select
  using (requester_user_id = auth.uid());

drop policy if exists "Owners can delete path join requests"
  on public.learning_path_join_requests;
create policy "Owners can delete path join requests"
  on public.learning_path_join_requests for delete
  using (
    exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Requesters can delete own join requests"
  on public.learning_path_join_requests;
create policy "Requesters can delete own join requests"
  on public.learning_path_join_requests for delete
  using (requester_user_id = auth.uid());

create or replace function public.request_learning_path_join(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  rec record;
  inserted_id uuid;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'signed-out');
  end if;
  if email = '' then
    return jsonb_build_object('ok', false, 'error', 'no-email');
  end if;
  if p_slug is null or length(trim(p_slug)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'missing');
  end if;

  select lp.id, lp.owner_id, lp.visibility, lp.is_catalog
    into rec
  from public.learning_paths lp
  where lp.slug = trim(p_slug)
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'missing');
  end if;
  if rec.is_catalog or rec.visibility is distinct from 'private' then
    return jsonb_build_object('ok', false, 'error', 'not-private');
  end if;
  if rec.owner_id = uid then
    return jsonb_build_object('ok', false, 'error', 'owner');
  end if;
  if public.is_learning_path_invitee(rec.id) then
    return jsonb_build_object('ok', false, 'error', 'already-invited');
  end if;

  insert into public.learning_path_join_requests (
    path_id,
    requester_user_id,
    requester_email
  )
  values (rec.id, uid, email)
  on conflict (path_id, requester_user_id) do nothing
  returning id into inserted_id;

  if inserted_id is null then
    return jsonb_build_object('ok', true, 'already', true);
  end if;
  return jsonb_build_object('ok', true, 'already', false);
end;
$$;

revoke all on function public.request_learning_path_join(text) from public;
grant execute on function public.request_learning_path_join(text) to authenticated;

create or replace function public.learning_path_public_access(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  rec record;
  requested boolean := false;
begin
  if p_slug is null or length(trim(p_slug)) = 0 then
    return jsonb_build_object(
      'exists', false,
      'accessible', false,
      'visibility', null,
      'join_requested', false
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
      'visibility', null,
      'join_requested', false
    );
  end if;

  if auth.uid() is not null then
    requested := exists (
      select 1
      from public.learning_path_join_requests r
      where r.path_id = rec.id
        and r.requester_user_id = auth.uid()
    );
  end if;

  if rec.is_catalog
     or rec.visibility in ('public', 'collaborative')
     or rec.owner_id = auth.uid()
     or public.is_learning_path_invitee(rec.id) then
    return jsonb_build_object(
      'exists', true,
      'accessible', true,
      'visibility', rec.visibility,
      'join_requested', requested
    );
  end if;

  return jsonb_build_object(
    'exists', true,
    'accessible', false,
    'visibility', rec.visibility,
    'join_requested', requested
  );
end;
$$;

revoke all on function public.learning_path_public_access(text) from public;
grant execute on function public.learning_path_public_access(text) to anon, authenticated;

grant select, delete on table public.learning_path_join_requests to authenticated;
