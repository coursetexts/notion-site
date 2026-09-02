-- name: 034_activity_feed_events
-- =============================================================================
-- Profile activity feed: keep resource-list suggestion decisions, and record
-- explored-node progress so followers can see public/collaborative path work.
-- =============================================================================

alter table public.learning_path_resource_suggestions
  add column if not exists status text not null default 'pending';

alter table public.learning_path_resource_suggestions
  add column if not exists responded_at timestamptz;

alter table public.learning_path_resource_suggestions
  drop constraint if exists learning_path_resource_suggestions_status_ck;

alter table public.learning_path_resource_suggestions
  add constraint learning_path_resource_suggestions_status_ck
  check (status in ('pending', 'accepted', 'declined'));

create index if not exists learning_path_resource_suggestions_user_status_idx
  on public.learning_path_resource_suggestions (user_id, status, responded_at desc);

drop policy if exists "Anyone can read collab resource suggestions"
  on public.learning_path_resource_suggestions;
create policy "Anyone can read collab resource suggestions"
  on public.learning_path_resource_suggestions for select
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and (
          p.visibility = 'collaborative'
          or p.owner_id = auth.uid()
        )
    )
  );

drop policy if exists "Path owner can respond to resource suggestions"
  on public.learning_path_resource_suggestions;
create policy "Path owner can respond to resource suggestions"
  on public.learning_path_resource_suggestions for update
  using (
    exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and p.owner_id = auth.uid()
    )
  );

create table if not exists public.learning_path_progress_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  path_id uuid not null references public.learning_paths (id) on delete cascade,
  node_id text not null,
  node_label text not null default '',
  status text not null default 'explored',
  created_at timestamptz not null default now(),
  unique (user_id, path_id, node_id, status),
  constraint learning_path_progress_events_status_ck
    check (status in ('explored', 'exploring'))
);

create index if not exists learning_path_progress_events_user_created_idx
  on public.learning_path_progress_events (user_id, created_at desc);

create index if not exists learning_path_progress_events_path_idx
  on public.learning_path_progress_events (path_id, created_at desc);

alter table public.learning_path_progress_events enable row level security;

drop policy if exists "Users can insert own learning path progress events"
  on public.learning_path_progress_events;
create policy "Users can insert own learning path progress events"
  on public.learning_path_progress_events for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read visible learning path progress events"
  on public.learning_path_progress_events;
create policy "Users can read visible learning path progress events"
  on public.learning_path_progress_events for select
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and (
          p.is_catalog = true
          or p.visibility in ('public', 'collaborative')
        )
    )
  );
