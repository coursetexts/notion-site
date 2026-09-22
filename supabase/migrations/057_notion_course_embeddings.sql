-- name: 057_notion_course_embeddings
-- =============================================================================
-- pgvector embeddings for Notion university courses (semantic search).
-- Keyed by Notion page id — not learning_paths. Service role only.
-- =============================================================================

create extension if not exists vector;

create table if not exists public.notion_course_embeddings (
  notion_page_id text primary key,
  title text not null,
  model text not null,
  content_hash text not null,
  embedding vector(384) not null,
  updated_at timestamptz not null default now()
);

create index if not exists notion_course_embeddings_hnsw
  on public.notion_course_embeddings
  using hnsw (embedding vector_cosine_ops);

alter table public.notion_course_embeddings enable row level security;

-- No select/insert/update/delete policies. The service role bypasses RLS.
-- anon and authenticated cannot read vectors.

create or replace function public.match_notion_course_embeddings(
  query_embedding vector(384),
  match_count int
)
returns table (notion_page_id text, title text, distance float)
language sql
stable
as $$
  select
    e.notion_page_id,
    e.title,
    (e.embedding <=> query_embedding) as distance
  from public.notion_course_embeddings e
  order by e.embedding <=> query_embedding
  limit greatest(1, least(match_count, 24));
$$;

revoke all on function public.match_notion_course_embeddings(vector, int)
  from public, anon, authenticated;
grant execute on function public.match_notion_course_embeddings(vector, int)
  to service_role;
