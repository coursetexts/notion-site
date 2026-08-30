-- name: 028_learning_path_resource_votes
-- =============================================================================
-- Upvotes on learning-path resource list items. Independent of sequence.
-- Allowed on public and collaborative paths (not private).
-- =============================================================================

create table if not exists public.learning_path_resource_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  path_id uuid not null references public.learning_paths (id) on delete cascade,
  node_id text not null,
  resource_id text not null,
  created_at timestamptz not null default now(),
  constraint learning_path_resource_votes_user_target_key
    unique (user_id, path_id, node_id, resource_id)
);

create index if not exists learning_path_resource_votes_target_idx
  on public.learning_path_resource_votes (path_id, node_id, resource_id);

alter table public.learning_path_resource_votes enable row level security;

drop policy if exists "Anyone can read learning path resource votes"
  on public.learning_path_resource_votes;
create policy "Anyone can read learning path resource votes"
  on public.learning_path_resource_votes for select
  using (
    exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and (
          p.is_catalog = true
          or p.visibility in ('public', 'collaborative')
          or p.owner_id = auth.uid()
        )
    )
  );

drop policy if exists "Users can upvote public learning path resources"
  on public.learning_path_resource_votes;
create policy "Users can upvote public learning path resources"
  on public.learning_path_resource_votes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and p.visibility in ('public', 'collaborative')
    )
  );

drop policy if exists "Users can remove own learning path resource votes"
  on public.learning_path_resource_votes;
create policy "Users can remove own learning path resource votes"
  on public.learning_path_resource_votes for delete
  using (auth.uid() = user_id);
