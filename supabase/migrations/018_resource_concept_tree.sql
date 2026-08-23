-- name: 018_resource_concept_tree
-- =============================================================================
-- Community resources: optional concept-tree label + curated-course origin.
-- Curated-course videos/tests/slides also appear in /community as a subset.
-- =============================================================================

alter table public.resources
  add column if not exists concept_tree text
    check (
      concept_tree is null or char_length(btrim(concept_tree)) between 1 and 1000
    );

alter table public.resources
  add column if not exists from_curated_course boolean not null default false;

alter table public.resources
  add column if not exists curated_course_slug text
    check (
      curated_course_slug is null
      or char_length(btrim(curated_course_slug)) between 1 and 200
    );

-- Include concept_tree in full-text search.
drop index if exists public.resources_search_tsv_idx;
alter table public.resources drop column if exists search_tsv;
alter table public.resources
  add column search_tsv tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(concept_tree, '')), 'C')
  ) stored;
create index if not exists resources_search_tsv_idx
  on public.resources using gin (search_tsv);

alter table public.curated_course_videos
  add column if not exists resource_id uuid
    references public.resources(id) on delete set null;

alter table public.curated_course_links
  add column if not exists resource_id uuid
    references public.resources(id) on delete set null;

create index if not exists curated_course_videos_resource_idx
  on public.curated_course_videos(resource_id)
  where resource_id is not null;

create index if not exists curated_course_links_resource_idx
  on public.curated_course_links(resource_id)
  where resource_id is not null;
