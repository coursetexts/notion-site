-- name: 036_knowledge_graph
-- =============================================================================
-- Site-wide knowledge catalog + edges. Users overlay acquired topics on this
-- graph. Writes go through the ingest API (and the unused cron handler).
-- Daily Gemini rebuild is implemented but disabled — see docs/knowledge.md.
-- =============================================================================

create table if not exists public.knowledge_topics (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  normalized_label text not null,
  last_seen_at timestamptz not null default now(),
  last_llm_at timestamptz,
  created_at timestamptz not null default now(),
  unique (normalized_label)
);

create table if not exists public.knowledge_topic_edges (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.knowledge_topics (id) on delete cascade,
  to_id uuid not null references public.knowledge_topics (id) on delete cascade,
  kind text not null,
  source text not null,
  confidence real not null default 1,
  updated_at timestamptz not null default now(),
  unique (from_id, to_id, kind),
  constraint knowledge_topic_edges_kind_ck
    check (kind in ('prerequisite', 'related', 'part_of')),
  constraint knowledge_topic_edges_source_ck
    check (source in ('path_structure', 'llm')),
  constraint knowledge_topic_edges_not_self_ck
    check (from_id <> to_id)
);

create index if not exists knowledge_topics_last_llm_idx
  on public.knowledge_topics (last_llm_at nulls first, last_seen_at desc);

create index if not exists knowledge_topic_edges_from_idx
  on public.knowledge_topic_edges (from_id);

create index if not exists knowledge_topic_edges_to_idx
  on public.knowledge_topic_edges (to_id);

alter table public.knowledge_topics enable row level security;
alter table public.knowledge_topic_edges enable row level security;

drop policy if exists "Anyone can read knowledge topics"
  on public.knowledge_topics;
create policy "Anyone can read knowledge topics"
  on public.knowledge_topics for select
  using (true);

drop policy if exists "Anyone can read knowledge topic edges"
  on public.knowledge_topic_edges;
create policy "Anyone can read knowledge topic edges"
  on public.knowledge_topic_edges for select
  using (true);
