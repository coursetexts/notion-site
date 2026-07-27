-- =============================================================================
-- LIVE-DB bridge (community-platform schema, after 000_community_platform_init)
-- Course-page comments: give courses an identity and let comments target them.
--
-- NOTE: this folder targets the LIVE database schema. The files in
-- supabase/migrations/ are the older course-page app schema and must NOT be
-- run against this project (table names collide).
-- =============================================================================

-- Courses referenced by comments. uuid pk so it can be a comments/votes
-- target_id; notion_page_id is the app's natural key (page/route id).
create table public.courses (
  id             uuid primary key default gen_random_uuid(),
  notion_page_id text unique not null,
  name           text not null,
  url            text,
  created_at     timestamptz not null default now()
);

create index idx_courses_notion_page_id on public.courses(notion_page_id);

alter table public.courses enable row level security;

create policy "Anyone can read courses"
  on public.courses for select using (true);

-- Course rows are just references (name + url); created lazily on first
-- comment, so any signed-in user may insert one.
create policy "Authenticated users can insert courses"
  on public.courses for insert with check (auth.role() = 'authenticated');

-- Let comments target courses (votes already support target_type 'comment').
alter type public.comment_target_type add value if not exists 'course';
