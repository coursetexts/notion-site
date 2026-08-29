-- name: 025_curated_course_node_resources
-- =============================================================================
-- One sequenced resource list per syllabus node (article, video, book, course,
-- paper, exercise). Replaces separate Videos / Slides / Tests sections.
-- Existing videos and links are copied in so the new list is not empty.
-- =============================================================================

do $$ begin
  create type public.curated_course_node_resource_kind as enum (
    'article', 'video', 'book', 'course', 'paper', 'exercise'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.curated_course_node_resources (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null
    references public.curated_course_nodes(id) on delete cascade,
  kind public.curated_course_node_resource_kind not null,
  sort_order integer not null default 0,
  title text not null check (char_length(title) between 1 and 500),
  url text check (url is null or char_length(url) between 1 and 2048),
  passage text,
  why text,
  resource_id uuid references public.resources(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists curated_course_node_resources_node_idx
  on public.curated_course_node_resources(node_id, sort_order);

create index if not exists curated_course_node_resources_resource_idx
  on public.curated_course_node_resources(resource_id)
  where resource_id is not null;

alter table public.curated_course_node_resources enable row level security;

drop policy if exists "Curated course node resources are publicly readable"
  on public.curated_course_node_resources;
create policy "Curated course node resources are publicly readable"
  on public.curated_course_node_resources for select using (true);

drop policy if exists "Authenticated users can insert curated course node resources"
  on public.curated_course_node_resources;
create policy "Authenticated users can insert curated course node resources"
  on public.curated_course_node_resources for insert
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update curated course node resources"
  on public.curated_course_node_resources;
create policy "Authenticated users can update curated course node resources"
  on public.curated_course_node_resources for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete curated course node resources"
  on public.curated_course_node_resources;
create policy "Authenticated users can delete curated course node resources"
  on public.curated_course_node_resources for delete
  using (auth.uid() is not null);

-- Copy existing videos, then slides, then tests, preserving per-node order.
insert into public.curated_course_node_resources (
  id, node_id, kind, sort_order, title, url, passage, resource_id, created_at, updated_at
)
select
  v.id,
  v.node_id,
  'video'::public.curated_course_node_resource_kind,
  v.sort_order,
  v.title,
  nullif(btrim(v.url), ''),
  v.annotation,
  v.resource_id,
  v.created_at,
  v.updated_at
from public.curated_course_videos v
where not exists (
  select 1
  from public.curated_course_node_resources r
  where r.id = v.id
);

insert into public.curated_course_node_resources (
  id, node_id, kind, sort_order, title, url, resource_id, created_at, updated_at
)
select
  l.id,
  l.node_id,
  case
    when l.kind = 'test' then 'exercise'::public.curated_course_node_resource_kind
    else 'article'::public.curated_course_node_resource_kind
  end,
  coalesce(vm.max_order, -1) + 1 + l.sort_order,
  l.title,
  nullif(btrim(l.url), ''),
  l.resource_id,
  l.created_at,
  l.updated_at
from public.curated_course_links l
left join (
  select node_id, max(sort_order) as max_order
  from public.curated_course_node_resources
  group by node_id
) vm on vm.node_id = l.node_id
where not exists (
  select 1
  from public.curated_course_node_resources r
  where r.id = l.id
);
