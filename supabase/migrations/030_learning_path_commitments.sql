-- name: 030_learning_path_commitments
-- =============================================================================
-- Per-user “committed” flags for profile Learning tab items.
-- Later this will drive reminders to finish a learning path.
-- target_key is `learning-path:{slug}` or `course:{notion_page_id}`.
-- =============================================================================

create table if not exists public.learning_path_commitments (
  user_id uuid not null references auth.users (id) on delete cascade,
  target_key text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_key)
);

create index if not exists learning_path_commitments_user_idx
  on public.learning_path_commitments (user_id, created_at desc);

alter table public.learning_path_commitments enable row level security;

drop policy if exists "Users can read own learning path commitments"
  on public.learning_path_commitments;
create policy "Users can read own learning path commitments"
  on public.learning_path_commitments for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own learning path commitments"
  on public.learning_path_commitments;
create policy "Users can insert own learning path commitments"
  on public.learning_path_commitments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own learning path commitments"
  on public.learning_path_commitments;
create policy "Users can delete own learning path commitments"
  on public.learning_path_commitments for delete
  using (auth.uid() = user_id);
