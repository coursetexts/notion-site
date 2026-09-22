-- name: 056_match_catalog_visible_learning_path_embeddings
-- =============================================================================
-- Semantic match no longer gates on kind ∈ {community, research}.
-- Any catalog-visible Learning Path with an embedding can be returned.
-- Private / hidden paths stay excluded. Unfilled course stubs stay excluded
-- (they are not catalog Learning Path cards on /paths/all-courses).
-- =============================================================================

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
    and (p.kind is distinct from 'course' or p.is_filled is true)
  order by e.embedding <=> query_embedding
  limit greatest(1, least(match_count, 24));
$$;

revoke all on function public.match_learning_path_embeddings(vector, int)
  from public, anon, authenticated;
grant execute on function public.match_learning_path_embeddings(vector, int)
  to service_role;
