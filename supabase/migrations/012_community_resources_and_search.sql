-- name: 012_community_resources_and_search
-- =============================================================================
-- Site-wide /community resources + knowledge components + FTS search RPC
-- Distinct from course_resources (per-course Community Wall).
-- submitted_by / created_by = auth.users.id (= profiles.user_id).
-- =============================================================================

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 300),
  description text,
  url text not null,
  type public.resource_type not null,
  status public.resource_status not null default 'approved',
  submitted_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_tsv tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored
);

create table if not exists public.knowledge_components (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 300),
  field text,
  description text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_tsv tsvector generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(field, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored
);

create index if not exists resources_created_at_idx
  on public.resources(created_at desc);
create index if not exists resources_submitted_by_idx
  on public.resources(submitted_by);
create index if not exists resources_search_tsv_idx
  on public.resources using gin (search_tsv);
create index if not exists knowledge_components_search_tsv_idx
  on public.knowledge_components using gin (search_tsv);

alter table public.resources enable row level security;
alter table public.knowledge_components enable row level security;

drop policy if exists "Resources are publicly readable" on public.resources;
create policy "Resources are publicly readable"
  on public.resources for select using (true);

drop policy if exists "Authenticated users can submit resources" on public.resources;
create policy "Authenticated users can submit resources"
  on public.resources for insert
  with check (auth.uid() = submitted_by);

drop policy if exists "Authors can update their resources" on public.resources;
create policy "Authors can update their resources"
  on public.resources for update
  using (auth.uid() = submitted_by)
  with check (auth.uid() = submitted_by);

drop policy if exists "Authors can delete their resources" on public.resources;
create policy "Authors can delete their resources"
  on public.resources for delete
  using (auth.uid() = submitted_by);

drop policy if exists "Knowledge components are publicly readable" on public.knowledge_components;
create policy "Knowledge components are publicly readable"
  on public.knowledge_components for select using (true);

drop policy if exists "Authenticated users can add knowledge components" on public.knowledge_components;
create policy "Authenticated users can add knowledge components"
  on public.knowledge_components for insert
  with check (auth.uid() = created_by);

drop policy if exists "Authors can update their knowledge components" on public.knowledge_components;
create policy "Authors can update their knowledge components"
  on public.knowledge_components for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

drop policy if exists "Authors can delete their knowledge components" on public.knowledge_components;
create policy "Authors can delete their knowledge components"
  on public.knowledge_components for delete
  using (auth.uid() = created_by);

create or replace function public.community_search_tsquery(q text)
returns tsquery
language sql
stable
set search_path = public, pg_temp
as $$
  with cleaned as (
    select btrim(regexp_replace(
      lower(left(coalesce(q, ''), 200)),
      '[^[:alnum:][:space:]]+', ' ', 'g'
    )) as s
  ),
  parts as (
    select
      nullif(btrim(regexp_replace(s, '\S+$', '')), '') as head,
      nullif(substring(s from '\S+$'), '') as last
    from cleaned
  )
  select case
    when last is null then null::tsquery
    else coalesce(plainto_tsquery('english', head), ''::tsquery)
         && to_tsquery('english', last || ':*')
  end
  from parts
$$;

create or replace function public.search_community(q text, max_results int default 30)
returns table (
  kind text,
  id uuid,
  title text,
  description text,
  url text,
  type text,
  created_at timestamptz,
  rank real,
  score bigint
)
language sql
stable
set search_path = public, pg_temp
as $$
  with tsq as (
    select public.community_search_tsquery(q) as query
  ),
  hits as (
    select
      'resource'::text as kind,
      r.id, r.title, r.description, r.url, r.type::text as type, r.created_at,
      ts_rank_cd(r.search_tsv, tsq.query) as rank
    from public.resources r, tsq
    where tsq.query is not null and r.search_tsv @@ tsq.query

    union all

    select
      'knowledge_component'::text,
      k.id, k.name, k.description, null, null, k.created_at,
      ts_rank_cd(k.search_tsv, tsq.query)
    from public.knowledge_components k, tsq
    where tsq.query is not null and k.search_tsv @@ tsq.query
  )
  select
    h.kind, h.id, h.title, h.description, h.url, h.type, h.created_at,
    h.rank,
    coalesce(v.score, 0) as score
  from hits h
  left join lateral (
    select sum(value)::bigint as score
    from public.votes
    where target_id = h.id and target_type::text = h.kind
  ) v on true
  order by h.rank desc, coalesce(v.score, 0) desc, h.created_at desc
  limit greatest(1, least(coalesce(max_results, 30), 100))
$$;

grant execute on function public.community_search_tsquery(text) to anon, authenticated;
grant execute on function public.search_community(text, int) to anon, authenticated;
