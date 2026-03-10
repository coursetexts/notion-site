-- Per-user per-course section progress (completion + bookmarks)
create table public.course_section_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  course_page_id text not null,
  section_label text not null,
  is_completed boolean not null default false,
  is_bookmarked boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, course_page_id, section_label)
);

create index idx_course_section_progress_user_course
  on public.course_section_progress(user_id, course_page_id);

alter table public.course_section_progress enable row level security;

create policy "Users can read own course section progress"
  on public.course_section_progress for select using (auth.uid() = user_id);

create policy "Users can insert own course section progress"
  on public.course_section_progress for insert with check (auth.uid() = user_id);

create policy "Users can update own course section progress"
  on public.course_section_progress for update using (auth.uid() = user_id);

create policy "Users can delete own course section progress"
  on public.course_section_progress for delete using (auth.uid() = user_id);
