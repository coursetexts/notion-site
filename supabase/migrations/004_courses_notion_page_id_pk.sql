-- Use notion_page_id as primary key for courses so we always have a stable key from the page.
-- Drop dependent tables first, then courses, then recreate.

drop table if exists public.annotations;
drop table if exists public.bookmarks;
drop table if exists public.comments;
drop table if exists public.courses;

-- Courses: notion_page_id (from the page/route) is the primary key
create table public.courses (
  notion_page_id text primary key,
  name text not null,
  url text,
  created_at timestamptz default now()
);

alter table public.courses enable row level security;

create policy "Anyone can read courses"
  on public.courses for select using (true);

create policy "Anyone can insert courses"
  on public.courses for insert with check (true);

create policy "Anyone can update courses"
  on public.courses for update using (true);

-- Comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id text not null references public.courses(notion_page_id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.comments enable row level security;

create policy "Anyone can read comments"
  on public.comments for select using (true);

create policy "Users can insert own comments"
  on public.comments for insert with check (auth.uid() = user_id);

create policy "Users can update own comments"
  on public.comments for update using (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.comments for delete using (auth.uid() = user_id);

-- Bookmarks
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id text not null references public.courses(notion_page_id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, course_id)
);

alter table public.bookmarks enable row level security;

create policy "Users can read own bookmarks"
  on public.bookmarks for select using (auth.uid() = user_id);

create policy "Users can insert own bookmarks"
  on public.bookmarks for insert with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
  on public.bookmarks for delete using (auth.uid() = user_id);

-- Annotations
create table public.annotations (
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

create policy "Anyone can read annotations"
  on public.annotations for select using (true);

create policy "Users can insert own annotations"
  on public.annotations for insert with check (auth.uid() = user_id);

create policy "Users can update own annotations"
  on public.annotations for update using (auth.uid() = user_id);

create policy "Users can delete own annotations"
  on public.annotations for delete using (auth.uid() = user_id);

-- Indexes
create index idx_comments_course_id on public.comments(course_id);
create index idx_comments_parent_comment_id on public.comments(parent_comment_id);
create index idx_comments_created_at on public.comments(created_at desc);
create index idx_bookmarks_user_id on public.bookmarks(user_id);
create index idx_annotations_course_id on public.annotations(course_id);
create index idx_annotations_course_section on public.annotations(course_id, section_id);
create index idx_annotations_parent_annotation_id on public.annotations(parent_annotation_id);
