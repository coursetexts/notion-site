-- name: 020_learning_paths
-- =============================================================================
-- Learning paths (catalog + user-owned) and per-user notes / resources / status.
-- =============================================================================

create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  owner_id uuid references auth.users (id) on delete cascade,
  title text not null,
  goal text not null,
  summary text not null default '',
  data jsonb not null,
  is_catalog boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_paths_catalog_owner_ck check (
    (is_catalog = true and owner_id is null)
    or (is_catalog = false and owner_id is not null)
  )
);

create index if not exists learning_paths_owner_created_idx
  on public.learning_paths (owner_id, created_at desc);

create index if not exists learning_paths_catalog_idx
  on public.learning_paths (created_at desc)
  where is_catalog;

alter table public.learning_paths enable row level security;

drop policy if exists "Anyone can read catalog learning paths"
  on public.learning_paths;
create policy "Anyone can read catalog learning paths"
  on public.learning_paths for select
  using (is_catalog = true);

drop policy if exists "Users can read own learning paths"
  on public.learning_paths;
create policy "Users can read own learning paths"
  on public.learning_paths for select
  using (owner_id = auth.uid());

drop policy if exists "Users can insert own learning paths"
  on public.learning_paths;
create policy "Users can insert own learning paths"
  on public.learning_paths for insert
  with check (
    owner_id = auth.uid()
    and is_catalog = false
  );

drop policy if exists "Users can update own learning paths"
  on public.learning_paths;
create policy "Users can update own learning paths"
  on public.learning_paths for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and is_catalog = false);

drop policy if exists "Users can delete own learning paths"
  on public.learning_paths;
create policy "Users can delete own learning paths"
  on public.learning_paths for delete
  using (owner_id = auth.uid() and is_catalog = false);

create table if not exists public.learning_path_user_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  path_id uuid not null references public.learning_paths (id) on delete cascade,
  notes jsonb not null default '{}'::jsonb,
  resources jsonb not null default '{}'::jsonb,
  node_status jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, path_id)
);

create index if not exists learning_path_user_state_path_idx
  on public.learning_path_user_state (path_id);

alter table public.learning_path_user_state enable row level security;

drop policy if exists "Users can read own learning path state"
  on public.learning_path_user_state;
create policy "Users can read own learning path state"
  on public.learning_path_user_state for select
  using (user_id = auth.uid());

drop policy if exists "Users can insert own learning path state"
  on public.learning_path_user_state;
create policy "Users can insert own learning path state"
  on public.learning_path_user_state for insert
  with check (user_id = auth.uid());

drop policy if exists "Users can update own learning path state"
  on public.learning_path_user_state;
create policy "Users can update own learning path state"
  on public.learning_path_user_state for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete own learning path state"
  on public.learning_path_user_state;
create policy "Users can delete own learning path state"
  on public.learning_path_user_state for delete
  using (user_id = auth.uid());
