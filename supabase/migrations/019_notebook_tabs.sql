-- Pages (tabs) inside a notebook; content is Tiptap / ProseMirror JSON

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

create policy "notebook_tabs select own notebook"
  on public.notebook_tabs for select
  using (
    exists (
      select 1 from public.notebooks n
      where n.id = notebook_tabs.notebook_id and n.user_id = auth.uid()
    )
  );

create policy "notebook_tabs insert own notebook"
  on public.notebook_tabs for insert
  with check (
    exists (
      select 1 from public.notebooks n
      where n.id = notebook_tabs.notebook_id and n.user_id = auth.uid()
    )
  );

create policy "notebook_tabs update own notebook"
  on public.notebook_tabs for update
  using (
    exists (
      select 1 from public.notebooks n
      where n.id = notebook_tabs.notebook_id and n.user_id = auth.uid()
    )
  );

create policy "notebook_tabs delete own notebook"
  on public.notebook_tabs for delete
  using (
    exists (
      select 1 from public.notebooks n
      where n.id = notebook_tabs.notebook_id and n.user_id = auth.uid()
    )
  );
