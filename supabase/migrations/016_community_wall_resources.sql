-- Community Wall: per-course resources with votes, comments, pinned, and bookmarks.

create table if not exists public.course_resources (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.courses(notion_page_id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text not null,
  link text,
  is_pinned boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_course_resources_course_id
  on public.course_resources(course_id);
create index if not exists idx_course_resources_course_pinned_created
  on public.course_resources(course_id, is_pinned desc, created_at desc);

alter table public.course_resources enable row level security;

create policy "Anyone can read course resources"
  on public.course_resources for select using (true);

create policy "Users can insert own course resources"
  on public.course_resources for insert with check (auth.uid() = user_id);

create policy "Users can update own course resources"
  on public.course_resources for update using (auth.uid() = user_id);

create policy "Users can delete own course resources"
  on public.course_resources for delete using (auth.uid() = user_id);


-- Votes: one row per user per resource (value 1 or -1)
create table if not exists public.course_resource_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  resource_id uuid references public.course_resources(id) on delete cascade not null,
  value smallint not null check (value in (1, -1)),
  created_at timestamptz default now(),
  unique(user_id, resource_id)
);

create index if not exists idx_course_resource_votes_resource
  on public.course_resource_votes(resource_id);

alter table public.course_resource_votes enable row level security;

create policy "Anyone can read course resource votes"
  on public.course_resource_votes for select using (true);

create policy "Users can insert own course resource vote"
  on public.course_resource_votes for insert with check (auth.uid() = user_id);

create policy "Users can update own course resource vote"
  on public.course_resource_votes for update using (auth.uid() = user_id);

create policy "Users can delete own course resource vote"
  on public.course_resource_votes for delete using (auth.uid() = user_id);


-- Comments: simple per-resource comment stream
create table if not exists public.course_resource_comments (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.course_resources(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_course_resource_comments_resource
  on public.course_resource_comments(resource_id);
create index if not exists idx_course_resource_comments_created
  on public.course_resource_comments(created_at desc);

alter table public.course_resource_comments enable row level security;

create policy "Anyone can read course resource comments"
  on public.course_resource_comments for select using (true);

create policy "Users can insert own course resource comments"
  on public.course_resource_comments for insert with check (auth.uid() = user_id);

create policy "Users can update own course resource comments"
  on public.course_resource_comments for update using (auth.uid() = user_id);

create policy "Users can delete own course resource comments"
  on public.course_resource_comments for delete using (auth.uid() = user_id);


-- Bookmarks: save resources to profile
create table if not exists public.course_resource_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  resource_id uuid references public.course_resources(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, resource_id)
);

create index if not exists idx_course_resource_bookmarks_user
  on public.course_resource_bookmarks(user_id);
create index if not exists idx_course_resource_bookmarks_resource
  on public.course_resource_bookmarks(resource_id);

alter table public.course_resource_bookmarks enable row level security;

create policy "Users can read own course resource bookmarks"
  on public.course_resource_bookmarks for select using (auth.uid() = user_id);

create policy "Users can insert own course resource bookmarks"
  on public.course_resource_bookmarks for insert with check (auth.uid() = user_id);

create policy "Users can delete own course resource bookmarks"
  on public.course_resource_bookmarks for delete using (auth.uid() = user_id);

