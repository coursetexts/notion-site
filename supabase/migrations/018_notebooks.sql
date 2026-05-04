-- User-owned notebooks (profile "Notebooks" tab; links live under Bookmarks for now)

create table if not exists public.notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled notebook',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notebooks_user_id_created_at_idx
  on public.notebooks (user_id, created_at desc);

alter table public.notebooks enable row level security;

create policy "Users select own notebooks"
  on public.notebooks for select
  using (auth.uid() = user_id);

create policy "Users insert own notebooks"
  on public.notebooks for insert
  with check (auth.uid() = user_id);

create policy "Users update own notebooks"
  on public.notebooks for update
  using (auth.uid() = user_id);

create policy "Users delete own notebooks"
  on public.notebooks for delete
  using (auth.uid() = user_id);
