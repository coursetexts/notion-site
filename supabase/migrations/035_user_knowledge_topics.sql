-- name: 035_user_knowledge_topics
-- =============================================================================
-- Topics a user has gained by finishing learning paths. Labels are unique per
-- user so the same knowledge can recur across paths without duplicating.
-- =============================================================================

create table if not exists public.user_knowledge_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  normalized_label text not null,
  source_path_id uuid references public.learning_paths (id) on delete set null,
  source_path_slug text,
  source_path_title text,
  created_at timestamptz not null default now(),
  unique (user_id, normalized_label)
);

create index if not exists user_knowledge_topics_user_label_idx
  on public.user_knowledge_topics (user_id, label);

create index if not exists user_knowledge_topics_user_created_idx
  on public.user_knowledge_topics (user_id, created_at desc);

alter table public.user_knowledge_topics enable row level security;

drop policy if exists "Anyone can read user knowledge topics"
  on public.user_knowledge_topics;
create policy "Anyone can read user knowledge topics"
  on public.user_knowledge_topics for select
  using (true);

drop policy if exists "Users can insert own knowledge topics"
  on public.user_knowledge_topics;
create policy "Users can insert own knowledge topics"
  on public.user_knowledge_topics for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own knowledge topics"
  on public.user_knowledge_topics;
create policy "Users can delete own knowledge topics"
  on public.user_knowledge_topics for delete
  using (auth.uid() = user_id);
