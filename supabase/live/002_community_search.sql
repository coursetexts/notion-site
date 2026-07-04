-- =============================================================================
-- LIVE-DB migration (community-platform schema, after 000_community_platform_init
-- and supabase/live/001_course_comments_bridge.sql).
-- Run this in the Supabase SQL editor — it is NOT applied automatically.
--
-- Community search MVP: Postgres full-text search over `resources` and
-- `knowledge_components`, exposed as an RPC `search_community(q)` that ranks
-- by FTS relevance and tie-breaks on vote score. No extensions required.
--
-- NOTE: this folder targets the LIVE database schema. The files in
-- supabase/migrations/ are the older course-page app schema and must NOT be
-- run against this project (table names collide).
--
-- `knowledge_components` live columns (confirmed): id, name, field,
-- description, created_by, created_at.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) resources: generated tsvector + GIN index
--    Title weighs A, description B (title matches rank higher).
-- -----------------------------------------------------------------------------
alter table public.resources
  add column if not exists search_tsv tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored;

create index if not exists resources_search_tsv_idx
  on public.resources using gin (search_tsv);

-- -----------------------------------------------------------------------------
-- 2) knowledge_components: generated tsvector + GIN index
-- -----------------------------------------------------------------------------
alter table public.knowledge_components
  add column if not exists search_tsv tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(field, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored;

create index if not exists knowledge_components_search_tsv_idx
  on public.knowledge_components using gin (search_tsv);

-- -----------------------------------------------------------------------------
-- 3) Query builder: turns raw user input into a prefix-matching tsquery so
--    search-as-you-type matches mid-word ("eigenv" → "eigenv:*"). Complete
--    words go through plainto_tsquery (stemmed); only the last token gets
--    the prefix wildcard. Punctuation is stripped so user input can never
--    produce tsquery syntax errors.
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 4) The search RPC. SECURITY INVOKER: respects the existing RLS select
--    policies on resources / knowledge_components / votes (all three must be
--    readable by anon for signed-out search, which matches how the /community
--    ledger already reads them from the browser).
--
--    Ordering: FTS relevance (ts_rank_cd) desc, then vote score desc, then
--    newest first. Vote score is summed live from `votes` — the live schema
--    has no denormalized score column. `target_type` is compared as text so
--    this works whether or not the enum has a 'knowledge_component' label yet.
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- If signed-out search returns no knowledge components but signed-in works,
-- the table is missing an anon select policy; add one to match resources:
--
--   create policy "knowledge components are publicly readable"
--     on public.knowledge_components for select using (true);
-- -----------------------------------------------------------------------------

-- Quick smoke test (run after the above):
--   select kind, title, rank, score from public.search_community('eigenv');
