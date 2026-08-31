-- name: 031_nav_pins
-- =============================================================================
-- Per-user “pin to top” flags for the header saved courses / paths list.
-- Saved bookmarks stay separate; this only sorts items to the top of the flyout.
-- target_key is `learning-path:{slug}` or `course:{notion_page_id}`.
-- =============================================================================

create table if not exists public.nav_pins (
  user_id uuid not null references auth.users (id) on delete cascade,
  target_key text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_key)
);

create index if not exists nav_pins_user_idx
  on public.nav_pins (user_id, created_at desc);

alter table public.nav_pins enable row level security;

drop policy if exists "Users can read own nav pins"
  on public.nav_pins;
create policy "Users can read own nav pins"
  on public.nav_pins for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own nav pins"
  on public.nav_pins;
create policy "Users can insert own nav pins"
  on public.nav_pins for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own nav pins"
  on public.nav_pins;
create policy "Users can delete own nav pins"
  on public.nav_pins for delete
  using (auth.uid() = user_id);
