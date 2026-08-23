-- name: 017_curated_course_links
-- =============================================================================
-- Per-topic tests and slides: simple title + URL lists on syllabus nodes.
-- =============================================================================

do $$ begin
  create type public.curated_course_link_kind as enum (
    'test', 'slide'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.curated_course_links (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null
    references public.curated_course_nodes(id) on delete cascade,
  kind public.curated_course_link_kind not null,
  sort_order integer not null default 0,
  title text not null check (char_length(title) between 1 and 500),
  url text not null check (char_length(url) between 1 and 2048),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists curated_course_links_node_idx
  on public.curated_course_links(node_id, kind, sort_order);

alter table public.curated_course_links enable row level security;

drop policy if exists "Curated course links are publicly readable"
  on public.curated_course_links;
create policy "Curated course links are publicly readable"
  on public.curated_course_links for select using (true);

drop policy if exists "Authenticated users can insert curated course links"
  on public.curated_course_links;
create policy "Authenticated users can insert curated course links"
  on public.curated_course_links for insert
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update curated course links"
  on public.curated_course_links;
create policy "Authenticated users can update curated course links"
  on public.curated_course_links for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete curated course links"
  on public.curated_course_links;
create policy "Authenticated users can delete curated course links"
  on public.curated_course_links for delete
  using (auth.uid() is not null);
