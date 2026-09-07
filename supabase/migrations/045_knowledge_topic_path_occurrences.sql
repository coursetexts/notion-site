-- name: 045_knowledge_topic_path_occurrences
-- =============================================================================
-- Which public learning paths each knowledge topic appears on. Exact-match
-- labels collapse onto one topic; an LLM pass can later cluster similar names.
-- Existing DBs: apply after 036. Public SELECT; writes via service role.
-- =============================================================================

create table if not exists public.knowledge_topic_path_occurrences (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.knowledge_topics (id) on delete cascade,
  path_id uuid references public.learning_paths (id) on delete cascade,
  path_slug text not null,
  path_title text not null,
  path_kind text not null,
  node_kind text not null default 'path_node',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, path_slug),
  constraint knowledge_topic_path_occurrences_kind_ck
    check (path_kind in ('community', 'research', 'course')),
  constraint knowledge_topic_path_occurrences_node_kind_ck
    check (node_kind in ('topic', 'subtopic', 'concept', 'path_node'))
);

create index if not exists knowledge_topic_path_occurrences_topic_idx
  on public.knowledge_topic_path_occurrences (topic_id);

create index if not exists knowledge_topic_path_occurrences_slug_idx
  on public.knowledge_topic_path_occurrences (path_slug);

create index if not exists knowledge_topic_path_occurrences_path_idx
  on public.knowledge_topic_path_occurrences (path_id)
  where path_id is not null;

alter table public.knowledge_topic_path_occurrences enable row level security;

drop policy if exists "Anyone can read knowledge topic path occurrences"
  on public.knowledge_topic_path_occurrences;
create policy "Anyone can read knowledge topic path occurrences"
  on public.knowledge_topic_path_occurrences for select
  using (true);
