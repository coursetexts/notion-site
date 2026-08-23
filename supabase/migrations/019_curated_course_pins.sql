-- name: 019_curated_course_pins
-- =============================================================================
-- Per-user pinned curated courses (header dropdown + syllabus nav pin).
-- =============================================================================

create table if not exists public.curated_course_pins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null
    references public.curated_courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create index if not exists curated_course_pins_user_idx
  on public.curated_course_pins(user_id, created_at desc);

alter table public.curated_course_pins enable row level security;

drop policy if exists "Users can read own curated course pins"
  on public.curated_course_pins;
create policy "Users can read own curated course pins"
  on public.curated_course_pins for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own curated course pins"
  on public.curated_course_pins;
create policy "Users can insert own curated course pins"
  on public.curated_course_pins for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own curated course pins"
  on public.curated_course_pins;
create policy "Users can delete own curated course pins"
  on public.curated_course_pins for delete
  using (auth.uid() = user_id);
