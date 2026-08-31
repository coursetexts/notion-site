-- name: 032_learning_path_resource_suggestions
-- =============================================================================
-- Suggested resources on collaborative learning paths.
-- Visitors propose items to the owner; they are not added to the official list
-- until the owner accepts them.
-- =============================================================================

create table if not exists public.learning_path_resource_suggestions (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.learning_paths (id) on delete cascade,
  node_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  href text,
  passage text not null default '',
  why text not null default '',
  sequence integer,
  created_at timestamptz not null default now()
);

create index if not exists learning_path_resource_suggestions_path_idx
  on public.learning_path_resource_suggestions (path_id, node_id, created_at desc);

alter table public.learning_path_resource_suggestions enable row level security;

drop policy if exists "Anyone can read collab resource suggestions"
  on public.learning_path_resource_suggestions;
create policy "Anyone can read collab resource suggestions"
  on public.learning_path_resource_suggestions for select
  using (
    exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and (
          p.visibility = 'collaborative'
          or p.owner_id = auth.uid()
        )
    )
  );

drop policy if exists "Users can suggest resources on collab paths"
  on public.learning_path_resource_suggestions;
create policy "Users can suggest resources on collab paths"
  on public.learning_path_resource_suggestions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and p.visibility = 'collaborative'
        and p.owner_id is distinct from auth.uid()
    )
  );

drop policy if exists "Suggester or owner can delete resource suggestions"
  on public.learning_path_resource_suggestions;
create policy "Suggester or owner can delete resource suggestions"
  on public.learning_path_resource_suggestions for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and p.owner_id = auth.uid()
    )
  );
