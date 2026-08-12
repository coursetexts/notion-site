-- name: 009_notebooks
-- =============================================================================
-- Notebooks + tabs (TipTap / ProseMirror JSON). Published notebooks are public.
-- =============================================================================

create table if not exists public.notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled notebook',
  description text not null default '',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notebooks_user_id_created_at_idx
  on public.notebooks (user_id, created_at desc);

create index if not exists notebooks_user_published_created_idx
  on public.notebooks (user_id, created_at desc)
  where published;

alter table public.notebooks enable row level security;

drop policy if exists "Users select own notebooks" on public.notebooks;
create policy "Users select own notebooks"
  on public.notebooks for select
  using (auth.uid() = user_id);

drop policy if exists "Anyone can read published notebooks" on public.notebooks;
create policy "Anyone can read published notebooks"
  on public.notebooks for select
  using (published = true);

drop policy if exists "Users insert own notebooks" on public.notebooks;
create policy "Users insert own notebooks"
  on public.notebooks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own notebooks" on public.notebooks;
create policy "Users update own notebooks"
  on public.notebooks for update
  using (auth.uid() = user_id);

drop policy if exists "Users delete own notebooks" on public.notebooks;
create policy "Users delete own notebooks"
  on public.notebooks for delete
  using (auth.uid() = user_id);

create table if not exists public.notebook_tabs (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid not null references public.notebooks (id) on delete cascade,
  title text not null default 'Untitled Tab',
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notebook_tabs_notebook_sort_idx
  on public.notebook_tabs (notebook_id, sort_order, created_at);

alter table public.notebook_tabs enable row level security;

drop policy if exists "notebook_tabs select own notebook" on public.notebook_tabs;
create policy "notebook_tabs select own notebook"
  on public.notebook_tabs for select
  using (
    exists (
      select 1 from public.notebooks n
      where n.id = notebook_tabs.notebook_id and n.user_id = auth.uid()
    )
  );

drop policy if exists "Anyone can read tabs of published notebooks" on public.notebook_tabs;
create policy "Anyone can read tabs of published notebooks"
  on public.notebook_tabs for select
  using (
    exists (
      select 1 from public.notebooks n
      where n.id = notebook_tabs.notebook_id and n.published = true
    )
  );

drop policy if exists "notebook_tabs insert own notebook" on public.notebook_tabs;
create policy "notebook_tabs insert own notebook"
  on public.notebook_tabs for insert
  with check (
    exists (
      select 1 from public.notebooks n
      where n.id = notebook_tabs.notebook_id and n.user_id = auth.uid()
    )
  );

drop policy if exists "notebook_tabs update own notebook" on public.notebook_tabs;
create policy "notebook_tabs update own notebook"
  on public.notebook_tabs for update
  using (
    exists (
      select 1 from public.notebooks n
      where n.id = notebook_tabs.notebook_id and n.user_id = auth.uid()
    )
  );

drop policy if exists "notebook_tabs delete own notebook" on public.notebook_tabs;
create policy "notebook_tabs delete own notebook"
  on public.notebook_tabs for delete
  using (
    exists (
      select 1 from public.notebooks n
      where n.id = notebook_tabs.notebook_id and n.user_id = auth.uid()
    )
  );
