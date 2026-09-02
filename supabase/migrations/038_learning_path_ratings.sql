-- name: 038_learning_path_ratings
-- =============================================================================
-- Per-user feedback after completing a topic or an entire learning path/course.
-- rating is enjoyment 0–100. duration_ms is the time the learner entered.
-- =============================================================================

create table if not exists public.learning_path_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  path_id uuid references public.learning_paths (id) on delete cascade,
  path_slug text not null,
  target_type text not null,
  target_id text not null,
  target_title text,
  rating smallint not null,
  duration_ms integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_path_ratings_type_ck
    check (target_type in ('topic', 'path')),
  constraint learning_path_ratings_rating_ck
    check (rating >= 0 and rating <= 100),
  constraint learning_path_ratings_duration_ck
    check (duration_ms >= 0),
  unique (user_id, path_slug, target_type, target_id)
);

create index if not exists learning_path_ratings_path_idx
  on public.learning_path_ratings (path_slug, target_type, created_at desc);

alter table public.learning_path_ratings enable row level security;

drop policy if exists "Users can read own learning path ratings"
  on public.learning_path_ratings;
create policy "Users can read own learning path ratings"
  on public.learning_path_ratings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own learning path ratings"
  on public.learning_path_ratings;
create policy "Users can insert own learning path ratings"
  on public.learning_path_ratings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own learning path ratings"
  on public.learning_path_ratings;
create policy "Users can update own learning path ratings"
  on public.learning_path_ratings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
