-- Profile "personal links" (Twitter, portfolio, etc.) — separate from bookmarked user_links.

create table public.profile_personal_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  url text not null,
  title text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_personal_links_url_len check (char_length(url) <= 2048),
  constraint profile_personal_links_title_len check (
    title is null or char_length(title) <= 160
  )
);

create index idx_profile_personal_links_user_id
  on public.profile_personal_links (user_id);

create index idx_profile_personal_links_user_sort
  on public.profile_personal_links (user_id, sort_order, created_at);

alter table public.profile_personal_links enable row level security;

create policy "Anyone can read profile personal links"
  on public.profile_personal_links for select using (true);

create policy "Users insert own profile personal links"
  on public.profile_personal_links for insert with check (auth.uid() = user_id);

create policy "Users update own profile personal links"
  on public.profile_personal_links for update using (auth.uid() = user_id);

create policy "Users delete own profile personal links"
  on public.profile_personal_links for delete using (auth.uid() = user_id);
