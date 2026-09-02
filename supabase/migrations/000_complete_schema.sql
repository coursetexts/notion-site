-- =============================================================================
-- COMPLETE SCHEMA — paste once into Supabase SQL Editor for a fresh project.
-- Equivalent to running 001–014 and 017–029 in order (skip 015/016 on a fresh DB).
-- See README.md for Auth + env setup.
-- Do NOT also run 001–029 individually on the same empty database.
-- Policies use DROP IF EXISTS so this is safe to re-run.
-- =============================================================================


-- >>> BEGIN 001_extensions_and_enums.sql

-- name: 001_extensions_and_enums
-- =============================================================================
-- Extensions + enums (final schema)
-- =============================================================================

create extension if not exists pgcrypto;

do $$ begin
  create type public.resource_type as enum (
    'textbook', 'video', 'paper', 'slides', 'problem_set'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.resource_status as enum (
    'pending', 'approved', 'rejected'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.curated_course_node_type as enum (
    'topic', 'subtopic', 'concept'
  );
exception when duplicate_object then null;
end $$;

-- <<< END 001_extensions_and_enums.sql


-- >>> BEGIN 002_profiles.sql

-- name: 002_profiles
-- =============================================================================
-- Profiles: one row per auth user (keyed by profiles.user_id = auth.users.id)
-- =============================================================================

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  display_name text,
  avatar_url text,
  email text,
  karma_score integer not null default 0,
  replies_last_read_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Anyone can read profiles" on public.profiles;
create policy "Anyone can read profiles"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Auto-create profile on signup (e.g. Google OAuth)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    user_id,
    display_name,
    avatar_url,
    email,
    replies_last_read_at
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    now()
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- <<< END 002_profiles.sql


-- >>> BEGIN 003_courses_activity.sql

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

-- <<< END 003_courses_activity.sql


-- >>> BEGIN 004_votes.sql

-- name: 004_votes
-- =============================================================================
-- Polymorphic votes (comment | annotation | resource | course_video)
-- =============================================================================

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  target_type text not null check (
    target_type in ('comment', 'annotation', 'resource', 'course_video')
  ),
  target_id uuid not null,
  value smallint not null check (value in (1, -1)),
  created_at timestamptz default now(),
  unique(user_id, target_type, target_id)
);

create index if not exists idx_votes_target on public.votes(target_type, target_id);

alter table public.votes enable row level security;

drop policy if exists "Anyone can read votes" on public.votes;
create policy "Anyone can read votes"
  on public.votes for select using (true);

drop policy if exists "Authenticated users can insert own vote" on public.votes;
create policy "Authenticated users can insert own vote"
  on public.votes for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own vote" on public.votes;
create policy "Users can update own vote"
  on public.votes for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own vote" on public.votes;
create policy "Users can delete own vote"
  on public.votes for delete using (auth.uid() = user_id);

-- Remove votes when comment or annotation is deleted
create or replace function public.delete_comment_votes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.votes where target_type = 'comment' and target_id = old.id;
  return old;
end;
$$;

create or replace function public.delete_annotation_votes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.votes where target_type = 'annotation' and target_id = old.id;
  return old;
end;
$$;

drop trigger if exists on_comment_delete_votes on public.comments;
create trigger on_comment_delete_votes
  after delete on public.comments
  for each row execute function public.delete_comment_votes();

drop trigger if exists on_annotation_delete_votes on public.annotations;
create trigger on_annotation_delete_votes
  after delete on public.annotations
  for each row execute function public.delete_annotation_votes();

-- <<< END 004_votes.sql


-- >>> BEGIN 005_follows.sql

-- name: 005_follows
-- =============================================================================
-- Follows (social graph)
-- =============================================================================

create table if not exists public.follows (
  follower_id uuid references auth.users(id) on delete cascade not null,
  following_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

create index if not exists idx_follows_following_id on public.follows(following_id);

alter table public.follows enable row level security;

drop policy if exists "Anyone can read follows" on public.follows;
create policy "Anyone can read follows"
  on public.follows for select using (true);

drop policy if exists "Users can insert own follow" on public.follows;
create policy "Users can insert own follow"
  on public.follows for insert with check (auth.uid() = follower_id);

drop policy if exists "Users can delete own follow" on public.follows;
create policy "Users can delete own follow"
  on public.follows for delete using (auth.uid() = follower_id);

-- <<< END 005_follows.sql


-- >>> BEGIN 006_user_links.sql

-- name: 006_user_links
-- =============================================================================
-- User bookmarked links (tags + many-to-many). Final shape (no legacy tag_id).
-- is_private is filtered in the app when viewing others' profiles; RLS stays
-- public-read to match production.
-- =============================================================================

create table if not exists public.link_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now(),
  unique(user_id, name)
);

create index if not exists idx_link_tags_user_id on public.link_tags(user_id);

alter table public.link_tags enable row level security;

drop policy if exists "Users can read own link tags" on public.link_tags;
create policy "Users can read own link tags"
  on public.link_tags for select using (auth.uid() = user_id);

drop policy if exists "Anyone can read link tags" on public.link_tags;
create policy "Anyone can read link tags"
  on public.link_tags for select using (true);

drop policy if exists "Users can insert own link tags" on public.link_tags;
create policy "Users can insert own link tags"
  on public.link_tags for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own link tags" on public.link_tags;
create policy "Users can delete own link tags"
  on public.link_tags for delete using (auth.uid() = user_id);

create table if not exists public.user_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  title text,
  note text,
  is_private boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists idx_user_links_user_id on public.user_links(user_id);

alter table public.user_links enable row level security;

drop policy if exists "Users can read own user links" on public.user_links;
create policy "Users can read own user links"
  on public.user_links for select using (auth.uid() = user_id);

drop policy if exists "Anyone can read user links" on public.user_links;
create policy "Anyone can read user links"
  on public.user_links for select using (true);

drop policy if exists "Users can insert own user links" on public.user_links;
create policy "Users can insert own user links"
  on public.user_links for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own user links" on public.user_links;
create policy "Users can update own user links"
  on public.user_links for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own user links" on public.user_links;
create policy "Users can delete own user links"
  on public.user_links for delete using (auth.uid() = user_id);

create table if not exists public.user_link_tags (
  link_id uuid references public.user_links(id) on delete cascade not null,
  tag_id uuid references public.link_tags(id) on delete cascade not null,
  primary key (link_id, tag_id)
);

create index if not exists idx_user_link_tags_link_id on public.user_link_tags(link_id);
create index if not exists idx_user_link_tags_tag_id on public.user_link_tags(tag_id);

alter table public.user_link_tags enable row level security;

drop policy if exists "Users can read link tags for own links" on public.user_link_tags;
create policy "Users can read link tags for own links"
  on public.user_link_tags for select
  using (
    exists (
      select 1 from public.user_links ul
      where ul.id = link_id and ul.user_id = auth.uid()
    )
  );

drop policy if exists "Anyone can read user link tags" on public.user_link_tags;
create policy "Anyone can read user link tags"
  on public.user_link_tags for select using (true);

drop policy if exists "Users can insert link tags for own links" on public.user_link_tags;
create policy "Users can insert link tags for own links"
  on public.user_link_tags for insert
  with check (
    exists (
      select 1 from public.user_links ul
      where ul.id = link_id and ul.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete link tags for own links" on public.user_link_tags;
create policy "Users can delete link tags for own links"
  on public.user_link_tags for delete
  using (
    exists (
      select 1 from public.user_links ul
      where ul.id = link_id and ul.user_id = auth.uid()
    )
  );

-- <<< END 006_user_links.sql


-- >>> BEGIN 007_course_section_progress.sql

-- name: 007_course_section_progress
-- =============================================================================
-- Per-user per-course section progress (completion + bookmarks)
-- course_page_id is the Notion page id (text); not a FK.
-- =============================================================================

create table if not exists public.course_section_progress (
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

create index if not exists idx_course_section_progress_user_course
  on public.course_section_progress(user_id, course_page_id);

alter table public.course_section_progress enable row level security;

drop policy if exists "Users can read own course section progress" on public.course_section_progress;
create policy "Users can read own course section progress"
  on public.course_section_progress for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own course section progress" on public.course_section_progress;
create policy "Users can insert own course section progress"
  on public.course_section_progress for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own course section progress" on public.course_section_progress;
create policy "Users can update own course section progress"
  on public.course_section_progress for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own course section progress" on public.course_section_progress;
create policy "Users can delete own course section progress"
  on public.course_section_progress for delete using (auth.uid() = user_id);

-- <<< END 007_course_section_progress.sql


-- >>> BEGIN 008_course_community_wall.sql

-- name: 008_course_community_wall
-- =============================================================================
-- Course Community Wall: per-course resources with votes, comments, bookmarks
-- (separate from site-wide public.resources)
-- =============================================================================

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

drop policy if exists "Anyone can read course resources" on public.course_resources;
create policy "Anyone can read course resources"
  on public.course_resources for select using (true);

drop policy if exists "Users can insert own course resources" on public.course_resources;
create policy "Users can insert own course resources"
  on public.course_resources for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own course resources" on public.course_resources;
create policy "Users can update own course resources"
  on public.course_resources for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own course resources" on public.course_resources;
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

drop policy if exists "Anyone can read course resource votes" on public.course_resource_votes;
create policy "Anyone can read course resource votes"
  on public.course_resource_votes for select using (true);

drop policy if exists "Users can insert own course resource vote" on public.course_resource_votes;
create policy "Users can insert own course resource vote"
  on public.course_resource_votes for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own course resource vote" on public.course_resource_votes;
create policy "Users can update own course resource vote"
  on public.course_resource_votes for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own course resource vote" on public.course_resource_votes;
create policy "Users can delete own course resource vote"
  on public.course_resource_votes for delete using (auth.uid() = user_id);

-- Comments: flat per-resource stream
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

drop policy if exists "Anyone can read course resource comments" on public.course_resource_comments;
create policy "Anyone can read course resource comments"
  on public.course_resource_comments for select using (true);

drop policy if exists "Users can insert own course resource comments" on public.course_resource_comments;
create policy "Users can insert own course resource comments"
  on public.course_resource_comments for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own course resource comments" on public.course_resource_comments;
create policy "Users can update own course resource comments"
  on public.course_resource_comments for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own course resource comments" on public.course_resource_comments;
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

drop policy if exists "Users can read own course resource bookmarks" on public.course_resource_bookmarks;
create policy "Users can read own course resource bookmarks"
  on public.course_resource_bookmarks for select using (auth.uid() = user_id);

drop policy if exists "Anyone can read course resource bookmarks" on public.course_resource_bookmarks;
create policy "Anyone can read course resource bookmarks"
  on public.course_resource_bookmarks for select using (true);

drop policy if exists "Users can insert own course resource bookmarks" on public.course_resource_bookmarks;
create policy "Users can insert own course resource bookmarks"
  on public.course_resource_bookmarks for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own course resource bookmarks" on public.course_resource_bookmarks;
create policy "Users can delete own course resource bookmarks"
  on public.course_resource_bookmarks for delete using (auth.uid() = user_id);

-- <<< END 008_course_community_wall.sql


-- >>> BEGIN 009_notebooks.sql

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

-- <<< END 009_notebooks.sql


-- >>> BEGIN 010_profile_interests_and_links.sql

-- name: 010_profile_interests_and_links
-- =============================================================================
-- Profile interests, personal links, and users directory RPC
-- =============================================================================

create table if not exists public.profile_interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  constraint profile_interests_tag_nonempty check (length(trim(tag)) > 0)
);

create unique index if not exists profile_interests_user_tag_lower_idx
  on public.profile_interests (user_id, lower(trim(tag)));

create index if not exists profile_interests_tag_lower_idx
  on public.profile_interests (lower(tag));

alter table public.profile_interests enable row level security;

drop policy if exists "Anyone can read profile interests" on public.profile_interests;
create policy "Anyone can read profile interests"
  on public.profile_interests for select
  using (true);

drop policy if exists "Users insert own profile interests" on public.profile_interests;
create policy "Users insert own profile interests"
  on public.profile_interests for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own profile interests" on public.profile_interests;
create policy "Users delete own profile interests"
  on public.profile_interests for delete
  using (auth.uid() = user_id);

-- Personal links (Twitter, portfolio, etc.) — separate from bookmarked user_links
create table if not exists public.profile_personal_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  url text not null,
  title text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_personal_links_url_len check (char_length(url) <= 2048),
  constraint profile_personal_links_title_len check (
    title is null or char_length(title) <= 160
  )
);

create index if not exists idx_profile_personal_links_user_id
  on public.profile_personal_links (user_id);

create index if not exists idx_profile_personal_links_user_sort
  on public.profile_personal_links (user_id, sort_order, created_at);

alter table public.profile_personal_links enable row level security;

drop policy if exists "Anyone can read profile personal links" on public.profile_personal_links;
create policy "Anyone can read profile personal links"
  on public.profile_personal_links for select using (true);

drop policy if exists "Users insert own profile personal links" on public.profile_personal_links;
create policy "Users insert own profile personal links"
  on public.profile_personal_links for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own profile personal links" on public.profile_personal_links;
create policy "Users update own profile personal links"
  on public.profile_personal_links for update using (auth.uid() = user_id);

drop policy if exists "Users delete own profile personal links" on public.profile_personal_links;
create policy "Users delete own profile personal links"
  on public.profile_personal_links for delete using (auth.uid() = user_id);

-- Paginated directory: profiles + follower counts + tags
create or replace function public.list_users_directory(
  p_search text,
  p_interest text,
  p_limit int,
  p_offset int
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select
      p.user_id,
      p.display_name,
      p.avatar_url,
      p.created_at,
      (
        select count(*)::int
        from public.follows f
        where f.following_id = p.user_id
      ) as follower_count
    from public.profiles p
    where
      (
        nullif(trim(coalesce(p_search, '')), '') is null
        or p.display_name ilike '%' || trim(p_search) || '%'
      )
      and (
        nullif(trim(coalesce(p_interest, '')), '') is null
        or exists (
          select 1
          from public.profile_interests pi
          where pi.user_id = p.user_id
            and pi.tag ilike '%' || trim(p_interest) || '%'
        )
      )
  ),
  totals as (
    select count(*)::int as total from base
  ),
  page_users as (
    select b.user_id, b.display_name, b.avatar_url, b.follower_count, b.created_at
    from base b
    order by b.created_at desc
    limit greatest(1, least(coalesce(nullif(p_limit, 0), 24), 48))
    offset greatest(0, coalesce(p_offset, 0))
  )
  select jsonb_build_object(
    'total', (select t.total from totals t),
    'users', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'user_id', pu.user_id,
            'display_name', pu.display_name,
            'avatar_url', pu.avatar_url,
            'follower_count', pu.follower_count,
            'tags', coalesce(
              (
                select jsonb_agg(pi.tag order by lower(pi.tag))
                from public.profile_interests pi
                where pi.user_id = pu.user_id
              ),
              '[]'::jsonb
            )
          )
          order by pu.created_at desc
        )
        from page_users pu
      ),
      '[]'::jsonb
    )
  );
$$;

grant execute on function public.list_users_directory(text, text, int, int)
  to anon, authenticated;

-- <<< END 010_profile_interests_and_links.sql


-- >>> BEGIN 011_community_wall_subscriptions.sql

-- name: 011_community_wall_subscriptions
-- =============================================================================
-- Community Wall subscriptions (follow a course wall for feed updates)
-- =============================================================================

create table if not exists public.community_wall_subscriptions (
  subscriber_id uuid references auth.users(id) on delete cascade not null,
  course_id text not null references public.courses(notion_page_id) on delete cascade,
  created_at timestamptz default now() not null,
  primary key (subscriber_id, course_id)
);

create index if not exists idx_community_wall_subscriptions_subscriber
  on public.community_wall_subscriptions(subscriber_id);
create index if not exists idx_community_wall_subscriptions_course
  on public.community_wall_subscriptions(course_id);

alter table public.community_wall_subscriptions enable row level security;

drop policy if exists "Users can read own community wall subscriptions" on public.community_wall_subscriptions;
create policy "Users can read own community wall subscriptions"
  on public.community_wall_subscriptions for select
  using (auth.uid() = subscriber_id);

drop policy if exists "Users can insert own community wall subscription" on public.community_wall_subscriptions;
create policy "Users can insert own community wall subscription"
  on public.community_wall_subscriptions for insert
  with check (auth.uid() = subscriber_id);

drop policy if exists "Users can delete own community wall subscription" on public.community_wall_subscriptions;
create policy "Users can delete own community wall subscription"
  on public.community_wall_subscriptions for delete
  using (auth.uid() = subscriber_id);

-- <<< END 011_community_wall_subscriptions.sql


-- >>> BEGIN 012_community_resources_and_search.sql

-- name: 012_community_resources_and_search
-- =============================================================================
-- Site-wide /community resources + knowledge components + FTS search RPC
-- Distinct from course_resources (per-course Community Wall).
-- submitted_by / created_by = auth.users.id (= profiles.user_id).
-- =============================================================================

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 300),
  description text,
  url text not null,
  type public.resource_type not null,
  status public.resource_status not null default 'approved',
  submitted_by uuid not null references auth.users(id) on delete cascade,
  concept_tree text
    check (
      concept_tree is null or char_length(btrim(concept_tree)) between 1 and 1000
    ),
  from_curated_course boolean not null default false,
  curated_course_slug text
    check (
      curated_course_slug is null
      or char_length(btrim(curated_course_slug)) between 1 and 200
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_tsv tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(concept_tree, '')), 'C')
  ) stored
);

create table if not exists public.knowledge_components (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 300),
  field text,
  description text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_tsv tsvector generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(field, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored
);

create index if not exists resources_created_at_idx
  on public.resources(created_at desc);
create index if not exists resources_submitted_by_idx
  on public.resources(submitted_by);
create index if not exists resources_search_tsv_idx
  on public.resources using gin (search_tsv);
create index if not exists knowledge_components_search_tsv_idx
  on public.knowledge_components using gin (search_tsv);

alter table public.resources enable row level security;
alter table public.knowledge_components enable row level security;

drop policy if exists "Resources are publicly readable" on public.resources;
create policy "Resources are publicly readable"
  on public.resources for select using (true);

drop policy if exists "Authenticated users can submit resources" on public.resources;
create policy "Authenticated users can submit resources"
  on public.resources for insert
  with check (auth.uid() = submitted_by);

drop policy if exists "Authors can update their resources" on public.resources;
create policy "Authors can update their resources"
  on public.resources for update
  using (auth.uid() = submitted_by)
  with check (auth.uid() = submitted_by);

drop policy if exists "Authors can delete their resources" on public.resources;
create policy "Authors can delete their resources"
  on public.resources for delete
  using (auth.uid() = submitted_by);

drop policy if exists "Knowledge components are publicly readable" on public.knowledge_components;
create policy "Knowledge components are publicly readable"
  on public.knowledge_components for select using (true);

drop policy if exists "Authenticated users can add knowledge components" on public.knowledge_components;
create policy "Authenticated users can add knowledge components"
  on public.knowledge_components for insert
  with check (auth.uid() = created_by);

drop policy if exists "Authors can update their knowledge components" on public.knowledge_components;
create policy "Authors can update their knowledge components"
  on public.knowledge_components for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

drop policy if exists "Authors can delete their knowledge components" on public.knowledge_components;
create policy "Authors can delete their knowledge components"
  on public.knowledge_components for delete
  using (auth.uid() = created_by);

create or replace function public.community_search_tsquery(q text)
returns tsquery
language sql
stable
set search_path = public, pg_temp
as $$
  with cleaned as (
    select btrim(regexp_replace(
      lower(left(coalesce(q, ''), 200)),
      '[^[:alnum:][:space:]]+', ' ', 'g'
    )) as s
  ),
  parts as (
    select
      nullif(btrim(regexp_replace(s, '\S+$', '')), '') as head,
      nullif(substring(s from '\S+$'), '') as last
    from cleaned
  )
  select case
    when last is null then null::tsquery
    else coalesce(plainto_tsquery('english', head), ''::tsquery)
         && to_tsquery('english', last || ':*')
  end
  from parts
$$;

create or replace function public.search_community(q text, max_results int default 30)
returns table (
  kind text,
  id uuid,
  title text,
  description text,
  url text,
  type text,
  created_at timestamptz,
  rank real,
  score bigint
)
language sql
stable
set search_path = public, pg_temp
as $$
  with tsq as (
    select public.community_search_tsquery(q) as query
  ),
  hits as (
    select
      'resource'::text as kind,
      r.id, r.title, r.description, r.url, r.type::text as type, r.created_at,
      ts_rank_cd(r.search_tsv, tsq.query) as rank
    from public.resources r, tsq
    where tsq.query is not null and r.search_tsv @@ tsq.query

    union all

    select
      'knowledge_component'::text,
      k.id, k.name, k.description, null, null, k.created_at,
      ts_rank_cd(k.search_tsv, tsq.query)
    from public.knowledge_components k, tsq
    where tsq.query is not null and k.search_tsv @@ tsq.query
  )
  select
    h.kind, h.id, h.title, h.description, h.url, h.type, h.created_at,
    h.rank,
    coalesce(v.score, 0) as score
  from hits h
  left join lateral (
    select sum(value)::bigint as score
    from public.votes
    where target_id = h.id and target_type::text = h.kind
  ) v on true
  order by h.rank desc, coalesce(v.score, 0) desc, h.created_at desc
  limit greatest(1, least(coalesce(max_results, 30), 100))
$$;

grant execute on function public.community_search_tsquery(text) to anon, authenticated;
grant execute on function public.search_community(text, int) to anon, authenticated;

-- <<< END 012_community_resources_and_search.sql


-- >>> BEGIN 013_curated_courses.sql

-- name: 013_curated_courses
-- =============================================================================
-- Curated courses: syllabus tree, curated videos, vote cleanup, per-user notes
-- votes.target_type still uses 'course_video' (polymorphic discriminant; see 004).
-- =============================================================================

create table if not exists public.curated_courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 1 and 300),
  description text,
  notion_page_id text references public.courses(notion_page_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists curated_courses_slug_idx
  on public.curated_courses(slug);

create table if not exists public.curated_course_nodes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null
    references public.curated_courses(id) on delete cascade,
  parent_id uuid
    references public.curated_course_nodes(id) on delete cascade,
  node_type public.curated_course_node_type not null,
  title text not null check (char_length(title) between 1 and 500),
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists curated_course_nodes_course_idx
  on public.curated_course_nodes(course_id, sort_order);

create index if not exists curated_course_nodes_parent_idx
  on public.curated_course_nodes(parent_id, sort_order);

create table if not exists public.curated_course_videos (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null
    references public.curated_course_nodes(id) on delete cascade,
  sort_order integer not null default 0,
  title text not null check (char_length(title) between 1 and 500),
  channel text,
  duration_seconds integer check (
    duration_seconds is null or duration_seconds >= 0
  ),
  url text not null,
  thumbnail_url text,
  annotation text,
  resource_id uuid references public.resources(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists curated_course_videos_node_idx
  on public.curated_course_videos(node_id, sort_order);

create index if not exists curated_course_videos_resource_idx
  on public.curated_course_videos(resource_id)
  where resource_id is not null;

alter table public.curated_courses enable row level security;
alter table public.curated_course_nodes enable row level security;
alter table public.curated_course_videos enable row level security;

drop policy if exists "Curated courses are publicly readable" on public.curated_courses;
create policy "Curated courses are publicly readable"
  on public.curated_courses for select using (true);

drop policy if exists "Authenticated users can insert curated courses" on public.curated_courses;
create policy "Authenticated users can insert curated courses"
  on public.curated_courses for insert
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update curated courses" on public.curated_courses;
create policy "Authenticated users can update curated courses"
  on public.curated_courses for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete curated courses" on public.curated_courses;
create policy "Authenticated users can delete curated courses"
  on public.curated_courses for delete
  using (auth.uid() is not null);

drop policy if exists "Curated course nodes are publicly readable" on public.curated_course_nodes;
create policy "Curated course nodes are publicly readable"
  on public.curated_course_nodes for select using (true);

drop policy if exists "Authenticated users can insert curated course nodes" on public.curated_course_nodes;
create policy "Authenticated users can insert curated course nodes"
  on public.curated_course_nodes for insert
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update curated course nodes" on public.curated_course_nodes;
create policy "Authenticated users can update curated course nodes"
  on public.curated_course_nodes for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete curated course nodes" on public.curated_course_nodes;
create policy "Authenticated users can delete curated course nodes"
  on public.curated_course_nodes for delete
  using (auth.uid() is not null);

drop policy if exists "Curated course videos are publicly readable" on public.curated_course_videos;
create policy "Curated course videos are publicly readable"
  on public.curated_course_videos for select using (true);

drop policy if exists "Authenticated users can insert curated course videos" on public.curated_course_videos;
create policy "Authenticated users can insert curated course videos"
  on public.curated_course_videos for insert
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update curated course videos" on public.curated_course_videos;
create policy "Authenticated users can update curated course videos"
  on public.curated_course_videos for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete curated course videos" on public.curated_course_videos;
create policy "Authenticated users can delete curated course videos"
  on public.curated_course_videos for delete
  using (auth.uid() is not null);

-- Clean up votes when a curated video is deleted
create or replace function public.delete_curated_course_video_votes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.votes
  where target_type = 'course_video' and target_id = old.id;
  return old;
end;
$$;

drop trigger if exists on_curated_course_video_delete_votes on public.curated_course_videos;
drop trigger if exists on_course_video_delete_votes on public.curated_course_videos;
create trigger on_curated_course_video_delete_votes
  after delete on public.curated_course_videos
  for each row execute function public.delete_curated_course_video_votes();

-- Per-user notes on syllabus nodes (node_id text supports seed ids and UUIDs)
create table if not exists public.curated_course_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id text not null check (char_length(node_id) between 1 and 200),
  course_slug text,
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, node_id)
);

create index if not exists curated_course_notes_user_node_idx
  on public.curated_course_notes(user_id, node_id);

create index if not exists curated_course_notes_user_slug_idx
  on public.curated_course_notes(user_id, course_slug);

alter table public.curated_course_notes enable row level security;

drop policy if exists "Users select own curated course notes" on public.curated_course_notes;
create policy "Users select own curated course notes"
  on public.curated_course_notes for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own curated course notes" on public.curated_course_notes;
create policy "Users insert own curated course notes"
  on public.curated_course_notes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own curated course notes" on public.curated_course_notes;
create policy "Users update own curated course notes"
  on public.curated_course_notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own curated course notes" on public.curated_course_notes;
create policy "Users delete own curated course notes"
  on public.curated_course_notes for delete
  using (auth.uid() = user_id);

-- <<< END 013_curated_courses.sql


-- >>> BEGIN 014_curated_course_resources.sql

-- name: 014_curated_course_resources
-- =============================================================================
-- Curated-course resources (textbooks / websites / video channels)
-- NOTE: public.course_resources already exists (Community Wall) — do not reuse.
-- =============================================================================

do $$ begin
  create type public.curated_course_resource_kind as enum (
    'textbook', 'website', 'youtube'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.curated_course_resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null
    references public.curated_courses(id) on delete cascade,
  kind public.curated_course_resource_kind not null,
  title text not null check (char_length(title) between 1 and 500),
  link_or_site text not null check (char_length(link_or_site) between 1 and 2048),
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists curated_course_resources_course_idx
  on public.curated_course_resources(course_id, kind, sort_order);

alter table public.curated_course_resources enable row level security;

drop policy if exists "Curated course resources are publicly readable"
  on public.curated_course_resources;
create policy "Curated course resources are publicly readable"
  on public.curated_course_resources for select using (true);

drop policy if exists "Authenticated users can insert curated course resources"
  on public.curated_course_resources;
create policy "Authenticated users can insert curated course resources"
  on public.curated_course_resources for insert
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update curated course resources"
  on public.curated_course_resources;
create policy "Authenticated users can update curated course resources"
  on public.curated_course_resources for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete curated course resources"
  on public.curated_course_resources;
create policy "Authenticated users can delete curated course resources"
  on public.curated_course_resources for delete
  using (auth.uid() is not null);

-- <<< END 014_curated_course_resources.sql

-- >>> BEGIN 017_curated_course_links.sql

-- name: 017_curated_course_links
-- =============================================================================
-- Per-topic tests and slides: simple title + URL lists on syllabus nodes.
-- =============================================================================

do $$ begin
  create type public.curated_course_link_kind as enum (
    'test', 'slide'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.curated_course_links (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null
    references public.curated_course_nodes(id) on delete cascade,
  kind public.curated_course_link_kind not null,
  sort_order integer not null default 0,
  title text not null check (char_length(title) between 1 and 500),
  url text not null check (char_length(url) between 1 and 2048),
  resource_id uuid references public.resources(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists curated_course_links_node_idx
  on public.curated_course_links(node_id, kind, sort_order);

create index if not exists curated_course_links_resource_idx
  on public.curated_course_links(resource_id)
  where resource_id is not null;

alter table public.curated_course_links enable row level security;

drop policy if exists "Curated course links are publicly readable"
  on public.curated_course_links;
create policy "Curated course links are publicly readable"
  on public.curated_course_links for select using (true);

drop policy if exists "Authenticated users can insert curated course links"
  on public.curated_course_links;
create policy "Authenticated users can insert curated course links"
  on public.curated_course_links for insert
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update curated course links"
  on public.curated_course_links;
create policy "Authenticated users can update curated course links"
  on public.curated_course_links for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete curated course links"
  on public.curated_course_links;
create policy "Authenticated users can delete curated course links"
  on public.curated_course_links for delete
  using (auth.uid() is not null);

-- <<< END 017_curated_course_links.sql


-- >>> BEGIN 018_resource_concept_tree.sql

-- name: 018_resource_concept_tree
-- =============================================================================
-- Community resources: optional concept-tree label + curated-course origin.
-- Curated-course videos/tests/slides also appear in /community as a subset.
-- =============================================================================

alter table public.resources
  add column if not exists concept_tree text
    check (
      concept_tree is null or char_length(btrim(concept_tree)) between 1 and 1000
    );

alter table public.resources
  add column if not exists from_curated_course boolean not null default false;

alter table public.resources
  add column if not exists curated_course_slug text
    check (
      curated_course_slug is null
      or char_length(btrim(curated_course_slug)) between 1 and 200
    );

drop index if exists public.resources_search_tsv_idx;
alter table public.resources drop column if exists search_tsv;
alter table public.resources
  add column search_tsv tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(concept_tree, '')), 'C')
  ) stored;
create index if not exists resources_search_tsv_idx
  on public.resources using gin (search_tsv);

alter table public.curated_course_videos
  add column if not exists resource_id uuid
    references public.resources(id) on delete set null;

alter table public.curated_course_links
  add column if not exists resource_id uuid
    references public.resources(id) on delete set null;

create index if not exists curated_course_videos_resource_idx
  on public.curated_course_videos(resource_id)
  where resource_id is not null;

create index if not exists curated_course_links_resource_idx
  on public.curated_course_links(resource_id)
  where resource_id is not null;

-- <<< END 018_resource_concept_tree.sql


-- >>> BEGIN 019_curated_course_pins.sql

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

-- <<< END 019_curated_course_pins.sql


-- >>> BEGIN 020_learning_paths.sql

-- name: 020_learning_paths
-- =============================================================================
-- Learning paths (catalog + user-owned) and per-user notes / resources / status.
-- =============================================================================

create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  owner_id uuid references auth.users (id) on delete cascade,
  title text not null,
  goal text not null,
  summary text not null default '',
  data jsonb not null,
  is_catalog boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_paths_catalog_owner_ck check (
    (is_catalog = true and owner_id is null)
    or (is_catalog = false and owner_id is not null)
  )
);

create index if not exists learning_paths_owner_created_idx
  on public.learning_paths (owner_id, created_at desc);

create index if not exists learning_paths_catalog_idx
  on public.learning_paths (created_at desc)
  where is_catalog;

alter table public.learning_paths enable row level security;

drop policy if exists "Anyone can read catalog learning paths"
  on public.learning_paths;
create policy "Anyone can read catalog learning paths"
  on public.learning_paths for select
  using (is_catalog = true);

drop policy if exists "Users can read own learning paths"
  on public.learning_paths;
create policy "Users can read own learning paths"
  on public.learning_paths for select
  using (owner_id = auth.uid());

drop policy if exists "Users can insert own learning paths"
  on public.learning_paths;
create policy "Users can insert own learning paths"
  on public.learning_paths for insert
  with check (
    owner_id = auth.uid()
    and is_catalog = false
  );

drop policy if exists "Users can update own learning paths"
  on public.learning_paths;
create policy "Users can update own learning paths"
  on public.learning_paths for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and is_catalog = false);

drop policy if exists "Users can delete own learning paths"
  on public.learning_paths;
create policy "Users can delete own learning paths"
  on public.learning_paths for delete
  using (owner_id = auth.uid() and is_catalog = false);

create table if not exists public.learning_path_user_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  path_id uuid not null references public.learning_paths (id) on delete cascade,
  notes jsonb not null default '{}'::jsonb,
  resources jsonb not null default '{}'::jsonb,
  node_status jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, path_id)
);

create index if not exists learning_path_user_state_path_idx
  on public.learning_path_user_state (path_id);

alter table public.learning_path_user_state enable row level security;

drop policy if exists "Users can read own learning path state"
  on public.learning_path_user_state;
create policy "Users can read own learning path state"
  on public.learning_path_user_state for select
  using (user_id = auth.uid());

drop policy if exists "Users can insert own learning path state"
  on public.learning_path_user_state;
create policy "Users can insert own learning path state"
  on public.learning_path_user_state for insert
  with check (user_id = auth.uid());

drop policy if exists "Users can update own learning path state"
  on public.learning_path_user_state;
create policy "Users can update own learning path state"
  on public.learning_path_user_state for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete own learning path state"
  on public.learning_path_user_state;
create policy "Users can delete own learning path state"
  on public.learning_path_user_state for delete
  using (user_id = auth.uid());

-- <<< END 020_learning_paths.sql

-- >>> BEGIN 021_course_notes.sql

-- name: 021_course_notes
-- =============================================================================
-- Per-user TipTap notes for Notion database courses (side panel "Your Notes").
-- =============================================================================

create table if not exists public.course_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id text not null check (char_length(course_id) between 1 and 200),
  topic_id text not null default '' check (char_length(topic_id) <= 200),
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, course_id, topic_id)
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

-- <<< END 021_course_notes.sql

-- >>> BEGIN 022_learning_path_privacy.sql

-- name: 022_learning_path_privacy
-- =============================================================================
-- User-owned learning paths can be public (shareable) or private (owner only).
-- Catalog rows stay publicly readable.
-- =============================================================================

alter table public.learning_paths
  add column if not exists is_private boolean not null default true;

update public.learning_paths
  set is_private = false
  where is_catalog = true;

drop policy if exists "Anyone can read catalog learning paths"
  on public.learning_paths;
drop policy if exists "Anyone can read public learning paths"
  on public.learning_paths;
create policy "Anyone can read public learning paths"
  on public.learning_paths for select
  using (is_catalog = true or is_private = false);

-- <<< END 022_learning_path_privacy.sql

-- >>> BEGIN 023_learning_path_kind.sql

-- name: 023_learning_path_kind
-- =============================================================================
-- User-owned paths created from a Field Atlas research question are
-- research learning paths. Everything else stays community (default).
-- =============================================================================

alter table public.learning_paths
  add column if not exists kind text not null default 'community';

alter table public.learning_paths
  drop constraint if exists learning_paths_kind_ck;

alter table public.learning_paths
  add constraint learning_paths_kind_ck
  check (kind in ('community', 'research'));

-- <<< END 023_learning_path_kind.sql


-- >>> BEGIN 024_course_notes_topic.sql

-- name: 024_course_notes_topic
-- =============================================================================
-- Course notes are per topic/tab, not one document for the whole course.
-- Existing rows keep topic_id = '' and are used as a read fallback.
-- =============================================================================

alter table public.course_notes
  add column if not exists topic_id text not null default '';

alter table public.course_notes
  drop constraint if exists course_notes_topic_id_len;
alter table public.course_notes
  add constraint course_notes_topic_id_len
  check (char_length(topic_id) <= 200);

alter table public.course_notes
  drop constraint if exists course_notes_user_id_course_id_key;
alter table public.course_notes
  drop constraint if exists course_notes_user_id_course_id_topic_id_key;
alter table public.course_notes
  drop constraint if exists course_notes_user_course_topic_key;
alter table public.course_notes
  add constraint course_notes_user_course_topic_key
  unique (user_id, course_id, topic_id);

-- <<< END 024_course_notes_topic.sql

-- >>> BEGIN 025_curated_course_node_resources.sql

-- name: 025_curated_course_node_resources
-- =============================================================================
-- One sequenced resource list per syllabus node (article, video, book, course,
-- paper, exercise). Replaces separate Videos / Slides / Tests sections.
-- Existing videos and links are copied in so the new list is not empty.
-- =============================================================================

do $$ begin
  create type public.curated_course_node_resource_kind as enum (
    'article', 'video', 'book', 'course', 'paper', 'exercise'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.curated_course_node_resources (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null
    references public.curated_course_nodes(id) on delete cascade,
  kind public.curated_course_node_resource_kind not null,
  sort_order integer not null default 0,
  title text not null check (char_length(title) between 1 and 500),
  url text check (url is null or char_length(url) between 1 and 2048),
  passage text,
  why text,
  resource_id uuid references public.resources(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists curated_course_node_resources_node_idx
  on public.curated_course_node_resources(node_id, sort_order);

create index if not exists curated_course_node_resources_resource_idx
  on public.curated_course_node_resources(resource_id)
  where resource_id is not null;

alter table public.curated_course_node_resources enable row level security;

drop policy if exists "Curated course node resources are publicly readable"
  on public.curated_course_node_resources;
create policy "Curated course node resources are publicly readable"
  on public.curated_course_node_resources for select using (true);

drop policy if exists "Authenticated users can insert curated course node resources"
  on public.curated_course_node_resources;
create policy "Authenticated users can insert curated course node resources"
  on public.curated_course_node_resources for insert
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update curated course node resources"
  on public.curated_course_node_resources;
create policy "Authenticated users can update curated course node resources"
  on public.curated_course_node_resources for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete curated course node resources"
  on public.curated_course_node_resources;
create policy "Authenticated users can delete curated course node resources"
  on public.curated_course_node_resources for delete
  using (auth.uid() is not null);

insert into public.curated_course_node_resources (
  id, node_id, kind, sort_order, title, url, passage, resource_id, created_at, updated_at
)
select
  v.id,
  v.node_id,
  'video'::public.curated_course_node_resource_kind,
  v.sort_order,
  v.title,
  nullif(btrim(v.url), ''),
  v.annotation,
  v.resource_id,
  v.created_at,
  v.updated_at
from public.curated_course_videos v
where not exists (
  select 1
  from public.curated_course_node_resources r
  where r.id = v.id
);

insert into public.curated_course_node_resources (
  id, node_id, kind, sort_order, title, url, resource_id, created_at, updated_at
)
select
  l.id,
  l.node_id,
  case
    when l.kind = 'test' then 'exercise'::public.curated_course_node_resource_kind
    else 'article'::public.curated_course_node_resource_kind
  end,
  coalesce(vm.max_order, -1) + 1 + l.sort_order,
  l.title,
  nullif(btrim(l.url), ''),
  l.resource_id,
  l.created_at,
  l.updated_at
from public.curated_course_links l
left join (
  select node_id, max(sort_order) as max_order
  from public.curated_course_node_resources
  group by node_id
) vm on vm.node_id = l.node_id
where not exists (
  select 1
  from public.curated_course_node_resources r
  where r.id = l.id
);

-- <<< END 025_curated_course_node_resources.sql

-- >>> BEGIN 026_learning_paths_public_research_goal.sql

-- name: 026_learning_paths_public_research_goal
-- =============================================================================
-- Field Atlas looks up a public research learning path by the question goal.
-- =============================================================================

create index if not exists learning_paths_public_research_goal_idx
  on public.learning_paths (goal, updated_at desc)
  where kind = 'research' and is_private = false;

-- <<< END 026_learning_paths_public_research_goal.sql

-- >>> BEGIN 027_unify_learning_paths.sql

-- name: 027_unify_learning_paths
-- =============================================================================
-- Course syllabi become learning_paths rows (kind = course). Add visibility
-- (private | public | collaborative). Copy pins/notes after stub course rows.
-- Does not DROP curated_* tables.
-- Does not move official Notion courses onto learning_paths (future work).
-- =============================================================================

alter table public.learning_paths
  drop constraint if exists learning_paths_kind_ck;

alter table public.learning_paths
  add constraint learning_paths_kind_ck
  check (kind in ('community', 'research', 'course'));

alter table public.learning_paths
  add column if not exists visibility text;

update public.learning_paths
  set visibility = case
    when is_catalog = true then 'public'
    when coalesce(is_private, true) then 'private'
    else 'public'
  end
  where visibility is null;

alter table public.learning_paths
  alter column visibility set default 'private';

alter table public.learning_paths
  alter column visibility set not null;

alter table public.learning_paths
  drop constraint if exists learning_paths_visibility_ck;

alter table public.learning_paths
  add constraint learning_paths_visibility_ck
  check (visibility in ('private', 'public', 'collaborative'));

update public.learning_paths
  set visibility = 'public',
      is_private = false
  where is_catalog = true;

create or replace function public.sync_learning_path_is_private()
returns trigger
language plpgsql
as $$
begin
  new.is_private := (new.visibility = 'private');
  return new;
end;
$$;

drop trigger if exists learning_paths_sync_is_private on public.learning_paths;
create trigger learning_paths_sync_is_private
  before insert or update of visibility, is_private
  on public.learning_paths
  for each row
  execute function public.sync_learning_path_is_private();

drop policy if exists "Anyone can read catalog learning paths"
  on public.learning_paths;
drop policy if exists "Anyone can read public learning paths"
  on public.learning_paths;
create policy "Anyone can read public learning paths"
  on public.learning_paths for select
  using (
    is_catalog = true
    or visibility in ('public', 'collaborative')
  );

drop policy if exists "Collaborators can update shared learning path data"
  on public.learning_paths;
create policy "Collaborators can update shared learning path data"
  on public.learning_paths for update
  using (
    auth.uid() is not null
    and kind = 'course'
    and is_catalog = true
  )
  with check (
    auth.uid() is not null
    and kind = 'course'
    and is_catalog = true
  );

create or replace function public.learning_paths_collaborator_guard()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.owner_id is not null and new.owner_id = auth.uid() then
    return new;
  end if;
  if old.slug is distinct from new.slug
     or old.owner_id is distinct from new.owner_id
     or old.is_catalog is distinct from new.is_catalog
     or old.kind is distinct from new.kind
     or old.visibility is distinct from new.visibility
     or old.title is distinct from new.title
     or old.goal is distinct from new.goal
     or old.summary is distinct from new.summary then
    raise exception 'Only the owner can change learning path metadata';
  end if;
  if old.data is distinct from new.data
     and not (old.kind = 'course' and old.is_catalog = true) then
    raise exception 'Only the owner can change the learning path outline';
  end if;
  return new;
end;
$$;

drop trigger if exists learning_paths_collaborator_guard on public.learning_paths;
create trigger learning_paths_collaborator_guard
  before update on public.learning_paths
  for each row
  execute function public.learning_paths_collaborator_guard();

drop index if exists public.learning_paths_public_research_goal_idx;
create index if not exists learning_paths_public_research_goal_idx
  on public.learning_paths (goal, updated_at desc)
  where kind = 'research' and visibility = 'public';

create index if not exists learning_paths_catalog_kind_idx
  on public.learning_paths (kind, created_at asc)
  where is_catalog;

create table if not exists public.learning_path_pins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  path_id uuid not null references public.learning_paths (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, path_id)
);

create index if not exists learning_path_pins_user_idx
  on public.learning_path_pins (user_id, created_at desc);

alter table public.learning_path_pins enable row level security;

drop policy if exists "Users can read own learning path pins"
  on public.learning_path_pins;
create policy "Users can read own learning path pins"
  on public.learning_path_pins for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own learning path pins"
  on public.learning_path_pins;
create policy "Users can insert own learning path pins"
  on public.learning_path_pins for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own learning path pins"
  on public.learning_path_pins;
create policy "Users can delete own learning path pins"
  on public.learning_path_pins for delete
  using (auth.uid() = user_id);

do $$
begin
  if to_regclass('public.curated_courses') is null then
    return;
  end if;

  insert into public.learning_paths (
    slug, owner_id, title, goal, summary, data,
    is_catalog, is_private, kind, visibility, created_at, updated_at
  )
  select
    c.slug,
    null,
    c.title,
    c.title,
    coalesce(c.description, ''),
    jsonb_build_object(
      'id', c.id,
      'slug', c.slug,
      'title', c.title,
      'description', coalesce(c.description, ''),
      'topics', '[]'::jsonb,
      'dbBacked', true
    ),
    true,
    false,
    'course',
    'public',
    c.created_at,
    now()
  from public.curated_courses c
  where not exists (
    select 1 from public.learning_paths lp where lp.slug = c.slug
  );

  if to_regclass('public.curated_course_notes') is not null
     and to_regclass('public.curated_course_nodes') is not null then
    insert into public.learning_path_user_state (
      user_id, path_id, notes, resources, node_status, updated_at
    )
    select
      mapped.user_id,
      mapped.path_id,
      jsonb_object_agg(mapped.node_id, mapped.content),
      '{}'::jsonb,
      '{}'::jsonb,
      now()
    from (
      select n.user_id, lp.id as path_id, n.node_id, n.content
      from public.curated_course_notes n
      join public.learning_paths lp
        on lp.kind = 'course'
       and n.course_slug is not null
       and n.course_slug <> ''
       and lp.slug = n.course_slug
      union
      select n.user_id, lp.id as path_id, n.node_id, n.content
      from public.curated_course_notes n
      join public.curated_course_nodes cn
        on cn.id::text = n.node_id
      join public.curated_courses cc
        on cc.id = cn.course_id
      join public.learning_paths lp
        on lp.kind = 'course' and lp.slug = cc.slug
    ) mapped
    group by mapped.user_id, mapped.path_id
    on conflict (user_id, path_id) do update
      set notes = public.learning_path_user_state.notes || excluded.notes,
          updated_at = now();
  end if;

  if to_regclass('public.curated_course_pins') is not null then
    insert into public.learning_path_pins (user_id, path_id, created_at)
    select p.user_id, lp.id, p.created_at
    from public.curated_course_pins p
    join public.curated_courses cc on cc.id = p.course_id
    join public.learning_paths lp
      on lp.kind = 'course' and lp.slug = cc.slug
    on conflict (user_id, path_id) do nothing;
  end if;
end $$;

-- <<< END 027_unify_learning_paths.sql

-- >>> BEGIN 028_learning_path_resource_votes.sql

-- name: 028_learning_path_resource_votes
-- =============================================================================
-- Upvotes on learning-path resource list items. Independent of sequence.
-- Allowed on public and collaborative paths (not private).
-- =============================================================================

create table if not exists public.learning_path_resource_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  path_id uuid not null references public.learning_paths (id) on delete cascade,
  node_id text not null,
  resource_id text not null,
  created_at timestamptz not null default now(),
  constraint learning_path_resource_votes_user_target_key
    unique (user_id, path_id, node_id, resource_id)
);

create index if not exists learning_path_resource_votes_target_idx
  on public.learning_path_resource_votes (path_id, node_id, resource_id);

alter table public.learning_path_resource_votes enable row level security;

drop policy if exists "Anyone can read learning path resource votes"
  on public.learning_path_resource_votes;
create policy "Anyone can read learning path resource votes"
  on public.learning_path_resource_votes for select
  using (
    exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and (
          p.is_catalog = true
          or p.visibility in ('public', 'collaborative')
          or p.owner_id = auth.uid()
        )
    )
  );

drop policy if exists "Users can upvote public learning path resources"
  on public.learning_path_resource_votes;
create policy "Users can upvote public learning path resources"
  on public.learning_path_resource_votes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and p.visibility in ('public', 'collaborative')
    )
  );

drop policy if exists "Users can remove own learning path resource votes"
  on public.learning_path_resource_votes;
create policy "Users can remove own learning path resource votes"
  on public.learning_path_resource_votes for delete
  using (auth.uid() = user_id);

-- <<< END 028_learning_path_resource_votes.sql

-- >>> BEGIN 029_learning_path_is_filled.sql

-- name: 029_learning_path_is_filled
-- =============================================================================
-- Course syllabi that have a real topic tree vs title-only catalog stubs.
-- `is_filled` is derived from data.topics (at least one topic with children).
-- All Courses lists only kind=course rows where is_filled is true.
-- =============================================================================

alter table public.learning_paths
  add column if not exists is_filled boolean not null default false;

create or replace function public.sync_learning_path_is_filled()
returns trigger
language plpgsql
as $$
begin
  if new.kind = 'course'
     and jsonb_typeof(coalesce(new.data, '{}'::jsonb)->'topics') = 'array'
     and jsonb_array_length(new.data->'topics') > 0
     and exists (
       select 1
       from jsonb_array_elements(new.data->'topics') as topic
       where jsonb_typeof(topic->'children') = 'array'
         and jsonb_array_length(topic->'children') > 0
     )
  then
    new.is_filled := true;
  else
    new.is_filled := false;
  end if;
  return new;
end;
$$;

drop trigger if exists learning_paths_sync_is_filled on public.learning_paths;
create trigger learning_paths_sync_is_filled
  before insert or update of data, kind, is_filled
  on public.learning_paths
  for each row
  execute function public.sync_learning_path_is_filled();

update public.learning_paths
set is_filled = (
  kind = 'course'
  and jsonb_typeof(coalesce(data, '{}'::jsonb)->'topics') = 'array'
  and jsonb_array_length(data->'topics') > 0
  and exists (
    select 1
    from jsonb_array_elements(data->'topics') as topic
    where jsonb_typeof(topic->'children') = 'array'
      and jsonb_array_length(topic->'children') > 0
  )
);

create index if not exists learning_paths_course_filled_idx
  on public.learning_paths (title)
  where kind = 'course' and is_filled = true;

-- <<< END 029_learning_path_is_filled.sql

-- >>> BEGIN 030_learning_path_commitments.sql

-- name: 030_learning_path_commitments
-- =============================================================================
-- Per-user “committed” flags for profile Learning tab items.
-- Later this will drive reminders to finish a learning path.
-- target_key is `learning-path:{slug}` or `course:{notion_page_id}`.
-- =============================================================================

create table if not exists public.learning_path_commitments (
  user_id uuid not null references auth.users (id) on delete cascade,
  target_key text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_key)
);

create index if not exists learning_path_commitments_user_idx
  on public.learning_path_commitments (user_id, created_at desc);

alter table public.learning_path_commitments enable row level security;

drop policy if exists "Users can read own learning path commitments"
  on public.learning_path_commitments;
create policy "Users can read own learning path commitments"
  on public.learning_path_commitments for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own learning path commitments"
  on public.learning_path_commitments;
create policy "Users can insert own learning path commitments"
  on public.learning_path_commitments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own learning path commitments"
  on public.learning_path_commitments;
create policy "Users can delete own learning path commitments"
  on public.learning_path_commitments for delete
  using (auth.uid() = user_id);

-- <<< END 030_learning_path_commitments.sql

-- >>> BEGIN 031_nav_pins.sql

-- name: 031_nav_pins
-- =============================================================================
-- Per-user “pin to top” flags for the header saved courses / paths list.
-- Saved bookmarks stay separate; this only sorts items to the top of the flyout.
-- target_key is `learning-path:{slug}` or `course:{notion_page_id}`.
-- =============================================================================

create table if not exists public.nav_pins (
  user_id uuid not null references auth.users (id) on delete cascade,
  target_key text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_key)
);

create index if not exists nav_pins_user_idx
  on public.nav_pins (user_id, created_at desc);

alter table public.nav_pins enable row level security;

drop policy if exists "Users can read own nav pins"
  on public.nav_pins;
create policy "Users can read own nav pins"
  on public.nav_pins for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own nav pins"
  on public.nav_pins;
create policy "Users can insert own nav pins"
  on public.nav_pins for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own nav pins"
  on public.nav_pins;
create policy "Users can delete own nav pins"
  on public.nav_pins for delete
  using (auth.uid() = user_id);

-- <<< END 031_nav_pins.sql

-- >>> BEGIN 032_learning_path_resource_suggestions.sql

-- name: 032_learning_path_resource_suggestions
-- =============================================================================
-- Suggested resources on collaborative learning paths.
-- Visitors propose items to the owner; they are not added to the official list
-- until the owner accepts them.
-- =============================================================================

create table if not exists public.learning_path_resource_suggestions (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.learning_paths (id) on delete cascade,
  node_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  href text,
  passage text not null default '',
  why text not null default '',
  sequence integer,
  created_at timestamptz not null default now()
);

create index if not exists learning_path_resource_suggestions_path_idx
  on public.learning_path_resource_suggestions (path_id, node_id, created_at desc);

alter table public.learning_path_resource_suggestions enable row level security;

drop policy if exists "Anyone can read collab resource suggestions"
  on public.learning_path_resource_suggestions;
create policy "Anyone can read collab resource suggestions"
  on public.learning_path_resource_suggestions for select
  using (
    exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and (
          p.visibility = 'collaborative'
          or p.owner_id = auth.uid()
        )
    )
  );

drop policy if exists "Users can suggest resources on collab paths"
  on public.learning_path_resource_suggestions;
create policy "Users can suggest resources on collab paths"
  on public.learning_path_resource_suggestions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and p.visibility = 'collaborative'
        and p.owner_id is distinct from auth.uid()
    )
  );

drop policy if exists "Suggester or owner can delete resource suggestions"
  on public.learning_path_resource_suggestions;
create policy "Suggester or owner can delete resource suggestions"
  on public.learning_path_resource_suggestions for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and p.owner_id = auth.uid()
    )
  );

-- <<< END 032_learning_path_resource_suggestions.sql

-- >>> BEGIN 033_learning_path_fill_usage.sql

-- name: 033_learning_path_fill_usage
-- =============================================================================
-- Daily auto-fill quota for learning-path outlines (15 per signed-in user).
-- =============================================================================

create table if not exists public.learning_path_fill_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  used_on date not null,
  fill_count integer not null default 0 check (fill_count >= 0),
  primary key (user_id, used_on)
);

alter table public.learning_path_fill_usage enable row level security;

drop policy if exists "Users can read own fill usage"
  on public.learning_path_fill_usage;
create policy "Users can read own fill usage"
  on public.learning_path_fill_usage for select
  using (auth.uid() = user_id);

create or replace function public.consume_learning_path_fill(
  max_per_day integer default 15
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  today date := (timezone('utc', now()))::date;
  next_count integer;
begin
  if uid is null then
    return jsonb_build_object('allowed', false, 'used', 0, 'remaining', 0);
  end if;

  insert into public.learning_path_fill_usage as usage (user_id, used_on, fill_count)
  values (uid, today, 1)
  on conflict (user_id, used_on)
  do update set fill_count = usage.fill_count + 1
  where usage.fill_count < max_per_day
  returning usage.fill_count into next_count;

  if next_count is null then
    select fill_count into next_count
    from public.learning_path_fill_usage
    where user_id = uid and used_on = today;

    return jsonb_build_object(
      'allowed', false,
      'used', coalesce(next_count, max_per_day),
      'remaining', 0
    );
  end if;

  return jsonb_build_object(
    'allowed', true,
    'used', next_count,
    'remaining', greatest(max_per_day - next_count, 0)
  );
end;
$$;

revoke all on function public.consume_learning_path_fill(integer) from public;
grant execute on function public.consume_learning_path_fill(integer) to authenticated;

-- <<< END 033_learning_path_fill_usage.sql

-- >>> BEGIN 034_activity_feed_events.sql

-- name: 034_activity_feed_events
-- =============================================================================
-- Profile activity feed: keep resource-list suggestion decisions, and record
-- explored-node progress so followers can see public/collaborative path work.
-- =============================================================================

alter table public.learning_path_resource_suggestions
  add column if not exists status text not null default 'pending';

alter table public.learning_path_resource_suggestions
  add column if not exists responded_at timestamptz;

alter table public.learning_path_resource_suggestions
  drop constraint if exists learning_path_resource_suggestions_status_ck;

alter table public.learning_path_resource_suggestions
  add constraint learning_path_resource_suggestions_status_ck
  check (status in ('pending', 'accepted', 'declined'));

create index if not exists learning_path_resource_suggestions_user_status_idx
  on public.learning_path_resource_suggestions (user_id, status, responded_at desc);

drop policy if exists "Anyone can read collab resource suggestions"
  on public.learning_path_resource_suggestions;
create policy "Anyone can read collab resource suggestions"
  on public.learning_path_resource_suggestions for select
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and (
          p.visibility = 'collaborative'
          or p.owner_id = auth.uid()
        )
    )
  );

drop policy if exists "Path owner can respond to resource suggestions"
  on public.learning_path_resource_suggestions;
create policy "Path owner can respond to resource suggestions"
  on public.learning_path_resource_suggestions for update
  using (
    exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and p.owner_id = auth.uid()
    )
  );

create table if not exists public.learning_path_progress_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  path_id uuid not null references public.learning_paths (id) on delete cascade,
  node_id text not null,
  node_label text not null default '',
  status text not null default 'explored',
  created_at timestamptz not null default now(),
  unique (user_id, path_id, node_id, status),
  constraint learning_path_progress_events_status_ck
    check (status in ('explored', 'exploring'))
);

create index if not exists learning_path_progress_events_user_created_idx
  on public.learning_path_progress_events (user_id, created_at desc);

create index if not exists learning_path_progress_events_path_idx
  on public.learning_path_progress_events (path_id, created_at desc);

alter table public.learning_path_progress_events enable row level security;

drop policy if exists "Users can insert own learning path progress events"
  on public.learning_path_progress_events;
create policy "Users can insert own learning path progress events"
  on public.learning_path_progress_events for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read visible learning path progress events"
  on public.learning_path_progress_events;
create policy "Users can read visible learning path progress events"
  on public.learning_path_progress_events for select
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and (
          p.is_catalog = true
          or p.visibility in ('public', 'collaborative')
        )
    )
  );

-- <<< END 034_activity_feed_events.sql

-- >>> BEGIN 035_user_knowledge_topics.sql

-- name: 035_user_knowledge_topics
-- =============================================================================
-- Topics a user has gained by finishing learning paths. Labels are unique per
-- user so the same knowledge can recur across paths without duplicating.
-- =============================================================================

create table if not exists public.user_knowledge_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  normalized_label text not null,
  source_path_id uuid references public.learning_paths (id) on delete set null,
  source_path_slug text,
  source_path_title text,
  created_at timestamptz not null default now(),
  unique (user_id, normalized_label)
);

create index if not exists user_knowledge_topics_user_label_idx
  on public.user_knowledge_topics (user_id, label);

create index if not exists user_knowledge_topics_user_created_idx
  on public.user_knowledge_topics (user_id, created_at desc);

alter table public.user_knowledge_topics enable row level security;

drop policy if exists "Anyone can read user knowledge topics"
  on public.user_knowledge_topics;
create policy "Anyone can read user knowledge topics"
  on public.user_knowledge_topics for select
  using (true);

drop policy if exists "Users can insert own knowledge topics"
  on public.user_knowledge_topics;
create policy "Users can insert own knowledge topics"
  on public.user_knowledge_topics for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own knowledge topics"
  on public.user_knowledge_topics;
create policy "Users can delete own knowledge topics"
  on public.user_knowledge_topics for delete
  using (auth.uid() = user_id);

-- <<< END 035_user_knowledge_topics.sql

-- >>> BEGIN 036_knowledge_graph.sql

-- name: 036_knowledge_graph
-- =============================================================================
-- Site-wide knowledge catalog + edges. Users overlay acquired topics on this
-- graph. Writes go through the ingest API (and the unused cron handler).
-- Daily Gemini rebuild is implemented but disabled — see docs/knowledge.md.
-- =============================================================================

create table if not exists public.knowledge_topics (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  normalized_label text not null,
  last_seen_at timestamptz not null default now(),
  last_llm_at timestamptz,
  created_at timestamptz not null default now(),
  unique (normalized_label)
);

create table if not exists public.knowledge_topic_edges (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.knowledge_topics (id) on delete cascade,
  to_id uuid not null references public.knowledge_topics (id) on delete cascade,
  kind text not null,
  source text not null,
  confidence real not null default 1,
  updated_at timestamptz not null default now(),
  unique (from_id, to_id, kind),
  constraint knowledge_topic_edges_kind_ck
    check (kind in ('prerequisite', 'related', 'part_of')),
  constraint knowledge_topic_edges_source_ck
    check (source in ('path_structure', 'llm')),
  constraint knowledge_topic_edges_not_self_ck
    check (from_id <> to_id)
);

create index if not exists knowledge_topics_last_llm_idx
  on public.knowledge_topics (last_llm_at nulls first, last_seen_at desc);

create index if not exists knowledge_topic_edges_from_idx
  on public.knowledge_topic_edges (from_id);

create index if not exists knowledge_topic_edges_to_idx
  on public.knowledge_topic_edges (to_id);

alter table public.knowledge_topics enable row level security;
alter table public.knowledge_topic_edges enable row level security;

drop policy if exists "Anyone can read knowledge topics"
  on public.knowledge_topics;
create policy "Anyone can read knowledge topics"
  on public.knowledge_topics for select
  using (true);

drop policy if exists "Anyone can read knowledge topic edges"
  on public.knowledge_topic_edges;
create policy "Anyone can read knowledge topic edges"
  on public.knowledge_topic_edges for select
  using (true);

-- <<< END 036_knowledge_graph.sql

-- >>> BEGIN 037_content_reports.sql

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reporter_email text,
  reporter_display_name text,
  target_type text not null,
  target_id text not null,
  target_url text,
  target_title text,
  target_snippet text,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  constraint content_reports_type_ck
    check (target_type in ('annotation', 'comment', 'learning_path', 'resource')),
  constraint content_reports_status_ck
    check (status in ('open', 'reviewed', 'dismissed')),
  constraint content_reports_reason_ck
    check (char_length(trim(reason)) > 0)
);

create unique index if not exists content_reports_reporter_target_uidx
  on public.content_reports (reporter_id, target_type, target_id);

create index if not exists content_reports_created_idx
  on public.content_reports (created_at desc);

create index if not exists content_reports_type_idx
  on public.content_reports (target_type, created_at desc);

alter table public.content_reports enable row level security;

drop policy if exists "Anyone can read content reports"
  on public.content_reports;
create policy "Anyone can read content reports"
  on public.content_reports for select
  using (true);

drop policy if exists "Users can insert own content reports"
  on public.content_reports;
create policy "Users can insert own content reports"
  on public.content_reports for insert
  with check (auth.uid() = reporter_id);

-- <<< END 037_content_reports.sql

-- >>> BEGIN 038_learning_path_ratings.sql

create table if not exists public.learning_path_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  path_id uuid references public.learning_paths (id) on delete cascade,
  path_slug text not null,
  target_type text not null,
  target_id text not null,
  target_title text,
  rating smallint not null,
  duration_ms integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_path_ratings_type_ck
    check (target_type in ('topic', 'path')),
  constraint learning_path_ratings_rating_ck
    check (rating >= 0 and rating <= 100),
  constraint learning_path_ratings_duration_ck
    check (duration_ms >= 0),
  unique (user_id, path_slug, target_type, target_id)
);

create index if not exists learning_path_ratings_path_idx
  on public.learning_path_ratings (path_slug, target_type, created_at desc);

alter table public.learning_path_ratings enable row level security;

drop policy if exists "Users can read own learning path ratings"
  on public.learning_path_ratings;
create policy "Users can read own learning path ratings"
  on public.learning_path_ratings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own learning path ratings"
  on public.learning_path_ratings;
create policy "Users can insert own learning path ratings"
  on public.learning_path_ratings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own learning path ratings"
  on public.learning_path_ratings;
create policy "Users can update own learning path ratings"
  on public.learning_path_ratings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- <<< END 038_learning_path_ratings.sql

