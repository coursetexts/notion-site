-- name: 003_courses_activity
-- =============================================================================
-- Courses + Course Activity (comments, bookmarks, annotations)
-- courses.notion_page_id is the stable PK (Notion page / route id).
-- comments: either a course comment (course_id set) OR a community target
--   (target_type + target_id), never both.
-- =============================================================================

create table if not exists public.courses (
  notion_page_id text primary key,
  name text not null,
  url text,
  created_at timestamptz default now()
);

alter table public.courses enable row level security;

drop policy if exists "Anyone can read courses" on public.courses;
create policy "Anyone can read courses"
  on public.courses for select using (true);

drop policy if exists "Anyone can insert courses" on public.courses;
create policy "Anyone can insert courses"
  on public.courses for insert with check (true);

drop policy if exists "Anyone can update courses" on public.courses;
create policy "Anyone can update courses"
  on public.courses for update using (true);

-- Comments (course activity + community targets)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id text references public.courses(notion_page_id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  body text not null,
  target_type text,
  target_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint comments_course_or_target_check check (
    (
      course_id is not null
      and target_type is null
      and target_id is null
    )
    or (
      course_id is null
      and target_type is not null
      and target_id is not null
    )
  )
);

alter table public.comments enable row level security;

drop policy if exists "Anyone can read comments" on public.comments;
create policy "Anyone can read comments"
  on public.comments for select using (true);

drop policy if exists "Users can insert own comments" on public.comments;
create policy "Users can insert own comments"
  on public.comments for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own comments" on public.comments;
create policy "Users can update own comments"
  on public.comments for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own comments" on public.comments;
create policy "Users can delete own comments"
  on public.comments for delete using (auth.uid() = user_id);

create index if not exists idx_comments_course_id on public.comments(course_id);
create index if not exists idx_comments_parent_comment_id on public.comments(parent_comment_id);
create index if not exists idx_comments_created_at on public.comments(created_at desc);
create index if not exists comments_target_idx
  on public.comments(target_type, target_id, created_at);

-- Bookmarks (saved courses)
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id text not null references public.courses(notion_page_id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, course_id)
);

alter table public.bookmarks enable row level security;

drop policy if exists "Users can read own bookmarks" on public.bookmarks;
create policy "Users can read own bookmarks"
  on public.bookmarks for select using (auth.uid() = user_id);

drop policy if exists "Anyone can read bookmarks" on public.bookmarks;
create policy "Anyone can read bookmarks"
  on public.bookmarks for select using (true);

drop policy if exists "Users can insert own bookmarks" on public.bookmarks;
create policy "Users can insert own bookmarks"
  on public.bookmarks for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own bookmarks" on public.bookmarks;
create policy "Users can delete own bookmarks"
  on public.bookmarks for delete using (auth.uid() = user_id);

create index if not exists idx_bookmarks_user_id on public.bookmarks(user_id);

-- Annotations (per section/tab on a course page)
create table if not exists public.annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id text not null references public.courses(notion_page_id) on delete cascade,
  section_id text not null,
  parent_annotation_id uuid references public.annotations(id) on delete cascade,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.annotations enable row level security;

drop policy if exists "Anyone can read annotations" on public.annotations;
create policy "Anyone can read annotations"
  on public.annotations for select using (true);

drop policy if exists "Users can insert own annotations" on public.annotations;
create policy "Users can insert own annotations"
  on public.annotations for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own annotations" on public.annotations;
create policy "Users can update own annotations"
  on public.annotations for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own annotations" on public.annotations;
create policy "Users can delete own annotations"
  on public.annotations for delete using (auth.uid() = user_id);

create index if not exists idx_annotations_course_id on public.annotations(course_id);
create index if not exists idx_annotations_course_section
  on public.annotations(course_id, section_id);
create index if not exists idx_annotations_parent_annotation_id
  on public.annotations(parent_annotation_id);
