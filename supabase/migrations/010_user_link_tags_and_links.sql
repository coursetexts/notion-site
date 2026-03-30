-- Tags for user's bookmarked links (create and assign to links)
create table public.link_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now(),
  unique(user_id, name)
);

create index idx_link_tags_user_id on public.link_tags(user_id);

alter table public.link_tags enable row level security;

create policy "Users can read own link tags"
  on public.link_tags for select using (auth.uid() = user_id);

create policy "Users can insert own link tags"
  on public.link_tags for insert with check (auth.uid() = user_id);

create policy "Users can delete own link tags"
  on public.link_tags for delete using (auth.uid() = user_id);

-- User bookmarked links (url, optional tag, optional note)
create table public.user_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  tag_id uuid references public.link_tags(id) on delete set null,
  note text,
  created_at timestamptz default now()
);

create index idx_user_links_user_id on public.user_links(user_id);
create index idx_user_links_tag_id on public.user_links(tag_id);

alter table public.user_links enable row level security;

create policy "Users can read own user links"
  on public.user_links for select using (auth.uid() = user_id);

create policy "Users can insert own user links"
  on public.user_links for insert with check (auth.uid() = user_id);

create policy "Users can update own user links"
  on public.user_links for update using (auth.uid() = user_id);

create policy "Users can delete own user links"
  on public.user_links for delete using (auth.uid() = user_id);
