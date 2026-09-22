-- name: 055_learning_path_embeddings
-- =============================================================================
-- pgvector embeddings for catalog-visible learning paths (semantic search).
-- Service role only: no anon/authenticated policies or execute grants.
-- =============================================================================

create extension if not exists vector;

create table if not exists public.learning_path_embeddings (
  path_id uuid primary key references public.learning_paths (id) on delete cascade,
  model text not null,
  content_hash text not null,
  embedding vector(384) not null,
  updated_at timestamptz not null default now()
);

create index if not exists learning_path_embeddings_hnsw
  on public.learning_path_embeddings
  using hnsw (embedding vector_cosine_ops);

alter table public.learning_path_embeddings enable row level security;

-- No select/insert/update/delete policies. The service role bypasses RLS.
-- anon and authenticated cannot read vectors.

create or replace function public.match_learning_path_embeddings(
  query_embedding vector(384),
  match_count int
)
returns table (path_id uuid, slug text, distance float)
language sql
stable
as $$
  select
    p.id,
    p.slug,
    (e.embedding <=> query_embedding) as distance
  from public.learning_path_embeddings e
  join public.learning_paths p on p.id = e.path_id
  where p.visibility is distinct from 'private'
    and not (p.visibility is null and p.is_private is true)
    and (
      p.kind in ('community', 'research')
      or (p.kind = 'course' and p.is_filled is true)
    )
  order by e.embedding <=> query_embedding
  limit greatest(1, least(match_count, 24));
$$;

revoke all on function public.match_learning_path_embeddings(vector, int)
  from public, anon, authenticated;
grant execute on function public.match_learning_path_embeddings(vector, int)
  to service_role;
