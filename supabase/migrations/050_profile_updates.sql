-- name: 050_profile_updates
-- =============================================================================
-- Profile Updates (tweet-like posts) + likes via votes.target_type
-- Comments/replies use existing polymorphic comments (target_type='profile_update')
-- =============================================================================

create table if not exists public.profile_updates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default '',
  description text not null default '',
  type text not null default 'Document'
    check (type in ('Video', 'Code', 'Presentation', 'Document')),
  url text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_updates_title_len check (char_length(title) <= 200),
  constraint profile_updates_description_len check (char_length(description) <= 4000),
  constraint profile_updates_url_len check (char_length(url) <= 2000),
  constraint profile_updates_has_content check (
    char_length(trim(title)) > 0 or char_length(trim(description)) > 0
  )
);

create index if not exists idx_profile_updates_user_created
  on public.profile_updates (user_id, created_at desc);

alter table public.profile_updates enable row level security;

drop policy if exists "Anyone can read profile updates" on public.profile_updates;
create policy "Anyone can read profile updates"
  on public.profile_updates for select using (true);

drop policy if exists "Users can insert own profile updates" on public.profile_updates;
create policy "Users can insert own profile updates"
  on public.profile_updates for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile updates" on public.profile_updates;
create policy "Users can update own profile updates"
  on public.profile_updates for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own profile updates" on public.profile_updates;
create policy "Users can delete own profile updates"
  on public.profile_updates for delete using (auth.uid() = user_id);

-- Allow likes (votes) on profile updates
do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.votes'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%target_type%';
  if cname is not null then
    execute format('alter table public.votes drop constraint %I', cname);
  end if;
end $$;

alter table public.votes
  add constraint votes_target_type_check check (
    target_type in (
      'comment',
      'annotation',
      'resource',
      'course_video',
      'profile_update'
    )
  );

create or replace function public.delete_profile_update_votes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.votes
  where target_type = 'profile_update' and target_id = old.id;
  delete from public.comments
  where target_type = 'profile_update' and target_id = old.id;
  return old;
end;
$$;

drop trigger if exists on_profile_update_delete_related on public.profile_updates;
create trigger on_profile_update_delete_related
  after delete on public.profile_updates
  for each row execute function public.delete_profile_update_votes();
