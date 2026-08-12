-- =============================================================================
-- COMPLETE SCHEMA — paste once into Supabase SQL Editor for a fresh project.
-- Equivalent to running 001–015 in order. See README.md for Auth + env setup.
-- Do NOT also run the old supabase/migrations/001–028 files on the same DB.
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_tsv tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists curated_course_videos_node_idx
  on public.curated_course_videos(node_id, sort_order);

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

