-- name: 005_follows
-- =============================================================================
-- Follows (social graph)
-- =============================================================================

create table if not exists public.follows (
  follower_id uuid references auth.users(id) on delete cascade not null,
  following_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

create index if not exists idx_follows_following_id on public.follows(following_id);

alter table public.follows enable row level security;

drop policy if exists "Anyone can read follows" on public.follows;
create policy "Anyone can read follows"
  on public.follows for select using (true);

drop policy if exists "Users can insert own follow" on public.follows;
create policy "Users can insert own follow"
  on public.follows for insert with check (auth.uid() = follower_id);

drop policy if exists "Users can delete own follow" on public.follows;
create policy "Users can delete own follow"
  on public.follows for delete using (auth.uid() = follower_id);
