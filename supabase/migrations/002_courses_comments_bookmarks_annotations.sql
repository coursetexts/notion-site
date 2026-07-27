-- Courses: reference record per course page (name + url); course content still from Notion
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  notion_page_id text,
  name text not null,
  url text not null unique,
  created_at timestamptz default now()
);

alter table public.courses enable row level security;

create policy "Anyone can read courses"
  on public.courses for select using (true);

create policy "Authenticated users can insert courses"
  on public.courses for insert
  with check (auth.role() = 'authenticated');

-- Comments: on the overall course page (only from Course Activity section)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.comments enable row level security;

create policy "Anyone can read comments"
  on public.comments for select using (true);

create policy "Users can insert own comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own comments"
  on public.comments for update
  using (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- Bookmarks (save course)
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, course_id)
);

alter table public.bookmarks enable row level security;

create policy "Users can read own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- Annotations: per section/tab on a course page (AnnotationWidget)
create table if not exists public.annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  section_id text not null,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.annotations enable row level security;

create policy "Anyone can read annotations"
  on public.annotations for select using (true);

create policy "Users can insert own annotations"
  on public.annotations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own annotations"
  on public.annotations for update
  using (auth.uid() = user_id);

create policy "Users can delete own annotations"
  on public.annotations for delete
  using (auth.uid() = user_id);

-- Indexes for common queries
create index if not exists idx_comments_course_id on public.comments(course_id);
create index if not exists idx_comments_created_at on public.comments(created_at desc);
create index if not exists idx_bookmarks_user_id on public.bookmarks(user_id);
create index if not exists idx_annotations_course_id on public.annotations(course_id);
create index if not exists idx_annotations_course_section on public.annotations(course_id, section_id);
