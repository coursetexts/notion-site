-- name: 006_user_links
-- =============================================================================
-- User bookmarked links (tags + many-to-many). Final shape (no legacy tag_id).
-- is_private is filtered in the app when viewing others' profiles; RLS stays
-- public-read to match production.
-- =============================================================================

create table if not exists public.link_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now(),
  unique(user_id, name)
);

create index if not exists idx_link_tags_user_id on public.link_tags(user_id);

alter table public.link_tags enable row level security;

drop policy if exists "Users can read own link tags" on public.link_tags;
create policy "Users can read own link tags"
  on public.link_tags for select using (auth.uid() = user_id);

drop policy if exists "Anyone can read link tags" on public.link_tags;
create policy "Anyone can read link tags"
  on public.link_tags for select using (true);

drop policy if exists "Users can insert own link tags" on public.link_tags;
create policy "Users can insert own link tags"
  on public.link_tags for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own link tags" on public.link_tags;
create policy "Users can delete own link tags"
  on public.link_tags for delete using (auth.uid() = user_id);

create table if not exists public.user_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  title text,
  note text,
  is_private boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists idx_user_links_user_id on public.user_links(user_id);

alter table public.user_links enable row level security;

drop policy if exists "Users can read own user links" on public.user_links;
create policy "Users can read own user links"
  on public.user_links for select using (auth.uid() = user_id);

drop policy if exists "Anyone can read user links" on public.user_links;
create policy "Anyone can read user links"
  on public.user_links for select using (true);

drop policy if exists "Users can insert own user links" on public.user_links;
create policy "Users can insert own user links"
  on public.user_links for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own user links" on public.user_links;
create policy "Users can update own user links"
  on public.user_links for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own user links" on public.user_links;
create policy "Users can delete own user links"
  on public.user_links for delete using (auth.uid() = user_id);

create table if not exists public.user_link_tags (
  link_id uuid references public.user_links(id) on delete cascade not null,
  tag_id uuid references public.link_tags(id) on delete cascade not null,
  primary key (link_id, tag_id)
);

create index if not exists idx_user_link_tags_link_id on public.user_link_tags(link_id);
create index if not exists idx_user_link_tags_tag_id on public.user_link_tags(tag_id);

alter table public.user_link_tags enable row level security;

drop policy if exists "Users can read link tags for own links" on public.user_link_tags;
create policy "Users can read link tags for own links"
  on public.user_link_tags for select
  using (
    exists (
      select 1 from public.user_links ul
      where ul.id = link_id and ul.user_id = auth.uid()
    )
  );

drop policy if exists "Anyone can read user link tags" on public.user_link_tags;
create policy "Anyone can read user link tags"
  on public.user_link_tags for select using (true);

drop policy if exists "Users can insert link tags for own links" on public.user_link_tags;
create policy "Users can insert link tags for own links"
  on public.user_link_tags for insert
  with check (
    exists (
      select 1 from public.user_links ul
      where ul.id = link_id and ul.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete link tags for own links" on public.user_link_tags;
create policy "Users can delete link tags for own links"
  on public.user_link_tags for delete
  using (
    exists (
      select 1 from public.user_links ul
      where ul.id = link_id and ul.user_id = auth.uid()
    )
  );
