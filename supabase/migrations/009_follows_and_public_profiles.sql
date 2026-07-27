-- Follows: who follows whom
create table public.follows (
  follower_id uuid references auth.users(id) on delete cascade not null,
  following_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

create index idx_follows_following_id on public.follows(following_id);

alter table public.follows enable row level security;

create policy "Anyone can read follows"
  on public.follows for select using (true);

create policy "Users can insert own follow"
  on public.follows for insert with check (auth.uid() = follower_id);

create policy "Users can delete own follow"
  on public.follows for delete using (auth.uid() = follower_id);

-- Allow reading any profile (for public profile pages)
create policy "Anyone can read profiles"
  on public.profiles for select using (true);

-- Allow reading any user's bookmarks (for public profile "bookmarked courses")
create policy "Anyone can read bookmarks"
  on public.bookmarks for select using (true);
