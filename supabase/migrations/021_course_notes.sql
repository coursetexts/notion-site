-- name: 021_course_notes
-- =============================================================================
-- Per-user TipTap notes for Notion database courses (side panel "Your Notes").
-- =============================================================================

create table if not exists public.course_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id text not null check (char_length(course_id) between 1 and 200),
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create index if not exists course_notes_user_course_idx
  on public.course_notes (user_id, course_id);

alter table public.course_notes enable row level security;

drop policy if exists "Users select own course notes" on public.course_notes;
create policy "Users select own course notes"
  on public.course_notes for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own course notes" on public.course_notes;
create policy "Users insert own course notes"
  on public.course_notes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own course notes" on public.course_notes;
create policy "Users update own course notes"
  on public.course_notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own course notes" on public.course_notes;
create policy "Users delete own course notes"
  on public.course_notes for delete
  using (auth.uid() = user_id);
