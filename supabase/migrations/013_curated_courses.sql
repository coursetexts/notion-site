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
