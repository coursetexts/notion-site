-- name: seed_fluid_mechanics_curated_course
-- =============================================================================
-- Self-contained Fluid Mechanics seed (handles messy rename states):
--   0) enums
--   1) rename course_video_* → curated_* if present
--   2) fix curated_courses_course / curated_courses_notes → correct names + FKs
--   3) create curated_* tables if missing
--   4) replace fluid-mechanics course + tree + videos + resources
-- Source: data/curated-courses/fluid-mechanics.json
-- =============================================================================

-- >>> ensure enums

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

-- >>> rename legacy course_video_* if present

-- =============================================================================
-- Rename legacy course_video_* tables → curated_courses / curated_course_*
-- Safe to run if you already applied the old 013 naming. No-ops if already renamed.
-- =============================================================================

do $$ begin
  create type public.curated_course_node_type as enum (
    'topic', 'subtopic', 'concept'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  if to_regclass('public.course_video_courses') is not null
     and to_regclass('public.curated_courses') is null then
    alter table public.course_video_courses rename to curated_courses;
  end if;
end $$;

do $$ begin
  if to_regclass('public.course_video_nodes') is not null
     and to_regclass('public.curated_course_nodes') is null then
    alter table public.course_video_nodes rename to curated_course_nodes;
  end if;
end $$;

do $$ begin
  if to_regclass('public.course_videos') is not null
     and to_regclass('public.curated_course_videos') is null then
    alter table public.course_videos rename to curated_course_videos;
  end if;
end $$;

do $$ begin
  if to_regclass('public.course_video_notes') is not null
     and to_regclass('public.curated_course_notes') is null then
    alter table public.course_video_notes rename to curated_course_notes;
  end if;
end $$;

-- Switch node_type column to new enum if still on old type
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'curated_course_nodes'
      and column_name = 'node_type'
      and udt_name = 'course_video_node_type'
  ) then
    alter table public.curated_course_nodes
      alter column node_type type public.curated_course_node_type
      using node_type::text::public.curated_course_node_type;
  end if;
exception when others then
  raise notice 'node_type enum migrate skipped: %', sqlerrm;
end $$;

alter index if exists course_video_courses_slug_idx rename to curated_courses_slug_idx;
alter index if exists course_video_nodes_course_idx rename to curated_course_nodes_course_idx;
alter index if exists course_video_nodes_parent_idx rename to curated_course_nodes_parent_idx;
alter index if exists course_videos_node_idx rename to curated_course_videos_node_idx;
alter index if exists course_video_notes_user_node_idx rename to curated_course_notes_user_node_idx;
alter index if exists course_video_notes_user_slug_idx rename to curated_course_notes_user_slug_idx;

-- Recreate vote-cleanup trigger only when curated_course_videos exists
do $$ begin
  if to_regclass('public.curated_course_videos') is not null then
    drop trigger if exists on_course_video_delete_votes on public.curated_course_videos;
    drop trigger if exists on_curated_course_video_delete_votes on public.curated_course_videos;
  end if;
end $$;

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

do $$ begin
  if to_regclass('public.curated_course_videos') is not null then
    create trigger on_curated_course_video_delete_votes
      after delete on public.curated_course_videos
      for each row execute function public.delete_curated_course_video_votes();
  end if;
end $$;

drop function if exists public.delete_course_video_votes();

-- >>> fix curated_courses_course / notes naming + FKs

-- =============================================================================
-- Fix botched renames seen in some DBs:
--   curated_courses_course  → curated_courses
--   curated_courses_notes   → curated_course_notes
-- Also repair FKs on nodes/resources so they reference curated_courses.
-- =============================================================================

-- 1) Main catalog table
do $$ begin
  if to_regclass('public.curated_courses_course') is not null then
    if to_regclass('public.curated_courses') is null then
      alter table public.curated_courses_course rename to curated_courses;
    else
      -- Both exist: keep curated_courses, merge missing catalog rows, drop duplicate
      insert into public.curated_courses (id, slug, title, description, notion_page_id, created_at, updated_at)
      select c.id, c.slug, c.title, c.description, c.notion_page_id, c.created_at, c.updated_at
      from public.curated_courses_course c
      where not exists (
        select 1 from public.curated_courses x where x.slug = c.slug or x.id = c.id
      );
      -- Point FKs away from the duplicate before drop
      alter table if exists public.curated_course_nodes
        drop constraint if exists course_video_nodes_course_id_fkey;
      alter table if exists public.curated_course_nodes
        drop constraint if exists curated_course_nodes_course_id_fkey;
      alter table if exists public.curated_course_nodes
        drop constraint if exists curated_courses_course_id_fkey;
      alter table if exists public.curated_course_resources
        drop constraint if exists curated_course_resources_course_id_fkey;
      alter table if exists public.curated_course_resources
        drop constraint if exists course_video_resources_course_id_fkey;

      -- Remap any node/resource rows still pointing at ids only in the duplicate
      update public.curated_course_nodes n
      set course_id = c.id
      from public.curated_courses_course d
      join public.curated_courses c on c.slug = d.slug
      where n.course_id = d.id
        and n.course_id is distinct from c.id;

      update public.curated_course_resources r
      set course_id = c.id
      from public.curated_courses_course d
      join public.curated_courses c on c.slug = d.slug
      where r.course_id = d.id
        and r.course_id is distinct from c.id;

      drop table public.curated_courses_course cascade;
    end if;
  end if;
end $$;

-- 2) Notes table
do $$ begin
  if to_regclass('public.curated_courses_notes') is not null
     and to_regclass('public.curated_course_notes') is null then
    alter table public.curated_courses_notes rename to curated_course_notes;
  elsif to_regclass('public.curated_courses_notes') is not null
     and to_regclass('public.curated_course_notes') is not null then
    insert into public.curated_course_notes (id, user_id, node_id, course_slug, content, created_at, updated_at)
    select n.id, n.user_id, n.node_id, n.course_slug, n.content, n.created_at, n.updated_at
    from public.curated_courses_notes n
    where not exists (
      select 1 from public.curated_course_notes x
      where x.user_id = n.user_id and x.node_id = n.node_id
    );
    drop table public.curated_courses_notes cascade;
  end if;
end $$;

-- 3) Ensure catalog table exists (no-op if already present)
create table if not exists public.curated_courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 1 and 300),
  description text,
  notion_page_id text references public.courses(notion_page_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4) Repair FK on curated_course_nodes → curated_courses
do $$ begin
  if to_regclass('public.curated_course_nodes') is not null then
    alter table public.curated_course_nodes
      drop constraint if exists course_video_nodes_course_id_fkey;
    alter table public.curated_course_nodes
      drop constraint if exists curated_course_nodes_course_id_fkey;
    alter table public.curated_course_nodes
      drop constraint if exists curated_courses_course_id_fkey;
    alter table public.curated_course_nodes
      drop constraint if exists curated_courses_course_course_id_fkey;

    -- Delete orphan nodes whose course_id is not in curated_courses
    delete from public.curated_course_nodes n
    where not exists (select 1 from public.curated_courses c where c.id = n.course_id);

    alter table public.curated_course_nodes
      add constraint curated_course_nodes_course_id_fkey
      foreign key (course_id) references public.curated_courses(id) on delete cascade;
  end if;
end $$;

-- 5) Repair FK on curated_course_resources → curated_courses
do $$ begin
  if to_regclass('public.curated_course_resources') is not null then
    alter table public.curated_course_resources
      drop constraint if exists curated_course_resources_course_id_fkey;
    alter table public.curated_course_resources
      drop constraint if exists course_video_resources_course_id_fkey;

    delete from public.curated_course_resources r
    where not exists (select 1 from public.curated_courses c where c.id = r.course_id);

    alter table public.curated_course_resources
      add constraint curated_course_resources_course_id_fkey
      foreign key (course_id) references public.curated_courses(id) on delete cascade;
  end if;
end $$;

-- >>> create curated tables if missing

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


-- >>> seed data
delete from public.curated_courses where slug = 'fluid-mechanics';

insert into public.curated_courses (id, slug, title, description)
values ('01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'fluid-mechanics', 'Fluid Mechanics', 'A one-semester engineering Fluid Mechanics course following calculus, physics, and statics/dynamics. It balances physical intuition, conservation-law modeling, engineering calculations, and laboratory interpretation.');

-- Syllabus nodes
insert into public.curated_course_nodes (id, course_id, parent_id, node_type, title, description, sort_order)
values
  ('430e8be6-4855-4c09-8375-bcde2a35bd4d', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', null, 'topic'::public.curated_course_node_type, 'Course Orientation, Fluid Properties, and Continuum Modeling', 'This opening unit establishes what makes a fluid different from a solid and how engineers model fluid behavior. Students learn the properties, units, and assumptions used throughout the course.', 0),
  ('3b074c3e-579c-4d6e-9685-6b2932c37fc1', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '430e8be6-4855-4c09-8375-bcde2a35bd4d', 'subtopic'::public.curated_course_node_type, 'Fluids and the Continuum Assumption', 'Students learn when matter can be treated as a continuous field rather than individual molecules.', 0),
  ('00e765d7-91c8-477d-a0f4-4317a9a52ef8', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '3b074c3e-579c-4d6e-9685-6b2932c37fc1', 'concept'::public.curated_course_node_type, 'Liquids versus gases', null, 0),
  ('3b4abe4a-c012-4a3b-a0b9-11f4dbdeddd3', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '3b074c3e-579c-4d6e-9685-6b2932c37fc1', 'concept'::public.curated_course_node_type, 'Continuum hypothesis', null, 1),
  ('8ae8b102-975a-4aa3-be11-0e409d74e992', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '3b074c3e-579c-4d6e-9685-6b2932c37fc1', 'concept'::public.curated_course_node_type, 'System, control mass, and control volume', null, 2),
  ('fe9d7f86-d7eb-4356-866c-e4a881c17966', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '430e8be6-4855-4c09-8375-bcde2a35bd4d', 'subtopic'::public.curated_course_node_type, 'Fluid Properties', 'Fluid properties connect material behavior to forces, flow, and energy loss.', 1),
  ('5f7384d4-75e3-4be9-adc4-2ba2c22e5817', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'fe9d7f86-d7eb-4356-866c-e4a881c17966', 'concept'::public.curated_course_node_type, 'Density, specific weight, and specific gravity', null, 0),
  ('b4e41c60-a725-424d-a5cc-41af784a9e71', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'fe9d7f86-d7eb-4356-866c-e4a881c17966', 'concept'::public.curated_course_node_type, 'Viscosity and Newtonian fluids', null, 1),
  ('b420fd05-69d6-4ba1-9a8b-5f5d45f1ef74', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'fe9d7f86-d7eb-4356-866c-e4a881c17966', 'concept'::public.curated_course_node_type, 'Surface tension, vapor pressure, and compressibility', null, 2),
  ('0578da66-6eb4-447b-9b16-afe7dcc2aaf3', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '430e8be6-4855-4c09-8375-bcde2a35bd4d', 'subtopic'::public.curated_course_node_type, 'Engineering Modeling and Units', 'A consistent modeling workflow keeps fluid calculations physically meaningful.', 2),
  ('355dcca9-97ff-4a0c-ae8b-145d66125da1', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '0578da66-6eb4-447b-9b16-afe7dcc2aaf3', 'concept'::public.curated_course_node_type, 'SI and US customary units', null, 0),
  ('83966fe5-c6cf-4ff4-94ec-b5aed577ff78', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '0578da66-6eb4-447b-9b16-afe7dcc2aaf3', 'concept'::public.curated_course_node_type, 'Dimensions and unit checks', null, 1),
  ('ef547e7d-ccab-4182-b7e6-6140669e8300', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '0578da66-6eb4-447b-9b16-afe7dcc2aaf3', 'concept'::public.curated_course_node_type, 'Assumptions, sketches, and reasonableness checks', null, 2),
  ('3595476d-b73c-436a-9982-585398b29fc0', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', null, 'topic'::public.curated_course_node_type, 'Fluid Statics, Pressure Variation, and Pressure Measurement', 'Fluid statics studies fluids at rest. This unit teaches how pressure varies with depth and how engineers measure pressure reliably.', 1),
  ('cee132d9-cc38-47ec-b1d1-b1cc3776213c', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '3595476d-b73c-436a-9982-585398b29fc0', 'subtopic'::public.curated_course_node_type, 'Pressure Concepts', 'Students learn pressure as a normal stress and distinguish common reference scales.', 0),
  ('82aef46b-5265-4f13-afd1-e16342c41544', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'cee132d9-cc38-47ec-b1d1-b1cc3776213c', 'concept'::public.curated_course_node_type, 'Absolute, gauge, and vacuum pressure', null, 0),
  ('df02f554-db06-48f0-9ea2-665dfdfe1a6b', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'cee132d9-cc38-47ec-b1d1-b1cc3776213c', 'concept'::public.curated_course_node_type, 'Pressure at a point', null, 1),
  ('fdfcfc15-00dd-45b3-84f7-864d14b43aa6', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'cee132d9-cc38-47ec-b1d1-b1cc3776213c', 'concept'::public.curated_course_node_type, 'Pascal''s law', null, 2),
  ('3289ae82-918e-47c8-95cf-33560a757ec6', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '3595476d-b73c-436a-9982-585398b29fc0', 'subtopic'::public.curated_course_node_type, 'Hydrostatic Pressure Variation', 'Students derive and apply the relationship between pressure and elevation.', 1),
  ('0a0d83f4-b4f8-4348-a552-1de3d16a3350', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '3289ae82-918e-47c8-95cf-33560a757ec6', 'concept'::public.curated_course_node_type, 'Hydrostatic equation', null, 0),
  ('6afe83ce-e9b1-4c18-af58-da17aae6a33b', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '3289ae82-918e-47c8-95cf-33560a757ec6', 'concept'::public.curated_course_node_type, 'Constant-density liquids', null, 1),
  ('a5e31d23-3620-4dd2-9f4a-4c83003dd213', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '3289ae82-918e-47c8-95cf-33560a757ec6', 'concept'::public.curated_course_node_type, 'Compressible atmosphere overview', null, 2),
  ('eb8fef1b-4f30-479c-b5de-b11bf7c7178a', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '3595476d-b73c-436a-9982-585398b29fc0', 'subtopic'::public.curated_course_node_type, 'Pressure Measurement', 'Students learn how devices translate pressure differences into measurable quantities.', 2),
  ('7c405e5c-fcfb-447d-b2fe-72d8946046a2', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'eb8fef1b-4f30-479c-b5de-b11bf7c7178a', 'concept'::public.curated_course_node_type, 'Piezometers and manometers', null, 0),
  ('ee649af7-6354-4c9a-b4a3-19bdf6690dce', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'eb8fef1b-4f30-479c-b5de-b11bf7c7178a', 'concept'::public.curated_course_node_type, 'Differential manometers', null, 1),
  ('d7edcc9c-1e59-4743-b19c-635fcf25649f', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'eb8fef1b-4f30-479c-b5de-b11bf7c7178a', 'concept'::public.curated_course_node_type, 'Barometers and pressure transducers', null, 2),
  ('7ad45f46-aaa3-4e69-9edb-d7a99439e7e7', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', null, 'topic'::public.curated_course_node_type, 'Hydrostatic Forces, Buoyancy, and Stability', 'This unit applies pressure fields to submerged and floating bodies. Students learn how distributed pressure creates resultant forces and moments.', 2),
  ('fe5bccc0-560b-4365-ac22-497bca0455aa', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '7ad45f46-aaa3-4e69-9edb-d7a99439e7e7', 'subtopic'::public.curated_course_node_type, 'Forces on Plane and Curved Surfaces', 'Students reduce distributed hydrostatic pressure to useful resultants.', 0),
  ('bf80e470-8b3a-4fb7-9a2c-2793896bb27a', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'fe5bccc0-560b-4365-ac22-497bca0455aa', 'concept'::public.curated_course_node_type, 'Magnitude of hydrostatic force', null, 0),
  ('29e8e563-46c2-4325-917b-27591389faa7', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'fe5bccc0-560b-4365-ac22-497bca0455aa', 'concept'::public.curated_course_node_type, 'Center of pressure', null, 1),
  ('f949b06f-e84d-40b7-8636-c9c2be0ab423', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'fe5bccc0-560b-4365-ac22-497bca0455aa', 'concept'::public.curated_course_node_type, 'Curved-surface force components', null, 2),
  ('93228295-8dfa-4bdc-9bb7-37cfbc30446c', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '7ad45f46-aaa3-4e69-9edb-d7a99439e7e7', 'subtopic'::public.curated_course_node_type, 'Buoyancy', 'Archimedes'' principle explains the upward force on immersed objects.', 1),
  ('eaeb501e-afdf-4fe8-b93c-d89213867e29', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '93228295-8dfa-4bdc-9bb7-37cfbc30446c', 'concept'::public.curated_course_node_type, 'Displaced-fluid weight', null, 0),
  ('b1b5e643-940d-497d-a573-1a7a614386e9', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '93228295-8dfa-4bdc-9bb7-37cfbc30446c', 'concept'::public.curated_course_node_type, 'Fully and partially submerged bodies', null, 1),
  ('1008e62d-24f7-435b-ae5e-5da562443231', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '93228295-8dfa-4bdc-9bb7-37cfbc30446c', 'concept'::public.curated_course_node_type, 'Apparent weight', null, 2),
  ('f9eb5fb1-ee0e-476b-8681-c1835875e332', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '7ad45f46-aaa3-4e69-9edb-d7a99439e7e7', 'subtopic'::public.curated_course_node_type, 'Stability of Floating and Submerged Bodies', 'Students learn why some bodies return to equilibrium while others overturn.', 2),
  ('d923660f-86d9-49d9-87d3-7a4f882ae332', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'f9eb5fb1-ee0e-476b-8681-c1835875e332', 'concept'::public.curated_course_node_type, 'Center of gravity and center of buoyancy', null, 0),
  ('8e86f838-c957-48f3-b7f9-c6ea7bf08646', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'f9eb5fb1-ee0e-476b-8681-c1835875e332', 'concept'::public.curated_course_node_type, 'Metacenter and metacentric height', null, 1),
  ('4e1510f0-cd5b-4795-951e-05b3e437babd', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'f9eb5fb1-ee0e-476b-8681-c1835875e332', 'concept'::public.curated_course_node_type, 'Stable, unstable, and neutral equilibrium', null, 2),
  ('d6fdbd88-a8da-45ae-bfb8-70d6f1a1ddf4', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', null, 'topic'::public.curated_course_node_type, 'Fluid Kinematics and Flow Description', 'Kinematics describes fluid motion without yet asking what forces cause it. Students learn to describe velocity fields, flow patterns, and local deformation.', 3),
  ('1a2dc489-0854-4151-9602-9bd2476edd9b', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'd6fdbd88-a8da-45ae-bfb8-70d6f1a1ddf4', 'subtopic'::public.curated_course_node_type, 'Flow Classification', 'Students learn standard ways to characterize fluid motion.', 0),
  ('b88abf2a-9e93-404d-bd69-167a421cf65d', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '1a2dc489-0854-4151-9602-9bd2476edd9b', 'concept'::public.curated_course_node_type, 'Steady and unsteady flow', null, 0),
  ('a17571b3-10cb-4b03-b9bf-55d2da73fb98', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '1a2dc489-0854-4151-9602-9bd2476edd9b', 'concept'::public.curated_course_node_type, 'Uniform and nonuniform flow', null, 1),
  ('b0c6ccfa-269f-4f7e-9e99-ebe9259f6fb9', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '1a2dc489-0854-4151-9602-9bd2476edd9b', 'concept'::public.curated_course_node_type, 'One-, two-, and three-dimensional descriptions', null, 2),
  ('6b7bab11-1eb1-4e96-ba63-b0e722e9c775', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'd6fdbd88-a8da-45ae-bfb8-70d6f1a1ddf4', 'subtopic'::public.curated_course_node_type, 'Velocity Fields and Streamlines', 'Velocity fields help students visualize how fluid particles move.', 1),
  ('fefb4f2f-a028-4c37-9fd3-005522098e0c', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '6b7bab11-1eb1-4e96-ba63-b0e722e9c775', 'concept'::public.curated_course_node_type, 'Streamlines, pathlines, and streaklines', null, 0),
  ('c5941042-ae8f-45ee-8df2-72a20326ca31', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '6b7bab11-1eb1-4e96-ba63-b0e722e9c775', 'concept'::public.curated_course_node_type, 'Acceleration of a fluid particle', null, 1),
  ('2e5cbce3-2959-4811-ba02-493bf64d749e', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '6b7bab11-1eb1-4e96-ba63-b0e722e9c775', 'concept'::public.curated_course_node_type, 'Material derivative concept', null, 2),
  ('d84f2b47-d5ea-4627-92ba-2895b9104d57', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'd6fdbd88-a8da-45ae-bfb8-70d6f1a1ddf4', 'subtopic'::public.curated_course_node_type, 'Rotation and Deformation', 'Students get an introductory view of how fluid elements translate, rotate, and strain.', 2),
  ('8f10e78b-2e8e-444e-b131-fb5122b4d0c5', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'd84f2b47-d5ea-4627-92ba-2895b9104d57', 'concept'::public.curated_course_node_type, 'Vorticity overview', null, 0),
  ('cf0ae45b-474a-4423-a64c-8c9580ef909d', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'd84f2b47-d5ea-4627-92ba-2895b9104d57', 'concept'::public.curated_course_node_type, 'Rate of deformation', null, 1),
  ('2725ef19-6b62-4055-a346-381da8896c0c', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'd84f2b47-d5ea-4627-92ba-2895b9104d57', 'concept'::public.curated_course_node_type, 'Incompressible-flow kinematics', null, 2),
  ('9c686452-e525-48f3-9e33-eb868e8c6638', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', null, 'topic'::public.curated_course_node_type, 'Bernoulli Equation and Mechanical Energy Concepts', 'Bernoulli''s equation connects pressure, velocity, and elevation along a flow. Students learn both its power and its limitations.', 4),
  ('1e66a059-edac-41c9-8192-17870917ba11', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '9c686452-e525-48f3-9e33-eb868e8c6638', 'subtopic'::public.curated_course_node_type, 'Derivation and Assumptions', 'Students learn when Bernoulli is valid rather than using it as a universal formula.', 0),
  ('7dbb41b4-4fbe-4956-8d9b-c47c490a1342', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '1e66a059-edac-41c9-8192-17870917ba11', 'concept'::public.curated_course_node_type, 'Steady, incompressible, inviscid assumptions', null, 0),
  ('2a37f0d7-cc46-4689-b1f0-2455c3b08524', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '1e66a059-edac-41c9-8192-17870917ba11', 'concept'::public.curated_course_node_type, 'Along a streamline', null, 1),
  ('47bddca3-3f5a-42e8-ada1-036a572167ae', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '1e66a059-edac-41c9-8192-17870917ba11', 'concept'::public.curated_course_node_type, 'Pressure, velocity, and elevation heads', null, 2),
  ('ecb38c12-6998-460f-ae86-d07cae7a7cac', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '9c686452-e525-48f3-9e33-eb868e8c6638', 'subtopic'::public.curated_course_node_type, 'Bernoulli Applications', 'Students apply the equation to common devices and flow situations.', 1),
  ('9cbe9416-53d9-43b4-ab62-34e1e8327071', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'ecb38c12-6998-460f-ae86-d07cae7a7cac', 'concept'::public.curated_course_node_type, 'Nozzles and diffusers', null, 0),
  ('9990efe1-fec8-40b7-95ac-14c70c5d26e2', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'ecb38c12-6998-460f-ae86-d07cae7a7cac', 'concept'::public.curated_course_node_type, 'Venturi meters and Pitot tubes', null, 1),
  ('8fd6ed3e-08d1-4e2c-8a75-16de18c751b9', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'ecb38c12-6998-460f-ae86-d07cae7a7cac', 'concept'::public.curated_course_node_type, 'Jets, tanks, and siphons', null, 2),
  ('26848c66-e7ba-45ae-8cdf-b2cf992e53bd', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '9c686452-e525-48f3-9e33-eb868e8c6638', 'subtopic'::public.curated_course_node_type, 'Energy Interpretation', 'Students connect Bernoulli terms to mechanical energy per unit weight.', 2),
  ('2de4d754-3aac-48a3-baa9-9a5a2bde0d1e', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '26848c66-e7ba-45ae-8cdf-b2cf992e53bd', 'concept'::public.curated_course_node_type, 'Static, dynamic, and stagnation pressure', null, 0),
  ('cd3ad60b-08a7-4807-9120-de89b8f91725', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '26848c66-e7ba-45ae-8cdf-b2cf992e53bd', 'concept'::public.curated_course_node_type, 'Energy grade concepts', null, 1),
  ('0f38074c-68c6-48f6-ac7c-8373bf6f2887', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '26848c66-e7ba-45ae-8cdf-b2cf992e53bd', 'concept'::public.curated_course_node_type, 'When losses and machines must be included', null, 2),
  ('0b32d4a9-9818-4442-b72b-f4d5cf011483', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', null, 'topic'::public.curated_course_node_type, 'Control-Volume Conservation of Mass', 'Mass conservation is the first universal balance law of fluid mechanics. Students learn to analyze flow through devices and networks using control volumes.', 5),
  ('0c6b5b5c-2b7a-42fb-88eb-dc1e532e77c5', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '0b32d4a9-9818-4442-b72b-f4d5cf011483', 'subtopic'::public.curated_course_node_type, 'Control Volume Framework', 'Students learn to draw boundaries around fluid systems and track what crosses them.', 0),
  ('912e22d3-4ef3-47d6-89f4-45dd22575e91', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '0c6b5b5c-2b7a-42fb-88eb-dc1e532e77c5', 'concept'::public.curated_course_node_type, 'Control surfaces', null, 0),
  ('3284a6cb-6a8b-49e6-82c5-c2000451bf68', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '0c6b5b5c-2b7a-42fb-88eb-dc1e532e77c5', 'concept'::public.curated_course_node_type, 'Inlets, outlets, and accumulation', null, 1),
  ('3902d9e4-e1cc-4aa6-bcc5-ea2a7a471cc8', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '0c6b5b5c-2b7a-42fb-88eb-dc1e532e77c5', 'concept'::public.curated_course_node_type, 'Steady versus unsteady balances', null, 2),
  ('d336b20c-dd9e-446e-978d-1ffd239ebb59', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '0b32d4a9-9818-4442-b72b-f4d5cf011483', 'subtopic'::public.curated_course_node_type, 'Continuity Equation', 'The continuity equation relates density, area, and velocity.', 1),
  ('a1eec9c6-8972-452a-a1f9-f0b862481a35', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'd336b20c-dd9e-446e-978d-1ffd239ebb59', 'concept'::public.curated_course_node_type, 'Integral mass balance', null, 0),
  ('06165643-4766-4a45-a3d8-37d3e2537dea', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'd336b20c-dd9e-446e-978d-1ffd239ebb59', 'concept'::public.curated_course_node_type, 'One-dimensional flow approximation', null, 1),
  ('fa61cec5-7ca8-45db-8f1f-45db5515f05d', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'd336b20c-dd9e-446e-978d-1ffd239ebb59', 'concept'::public.curated_course_node_type, 'Incompressible and compressible forms', null, 2),
  ('37c70893-bfdc-45d4-afb1-88dcd8f590e6', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '0b32d4a9-9818-4442-b72b-f4d5cf011483', 'subtopic'::public.curated_course_node_type, 'Applications', 'Students use mass conservation in practical flow systems.', 2),
  ('00cf8bbd-855c-4b8f-acc6-a995eab5bffb', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '37c70893-bfdc-45d4-afb1-88dcd8f590e6', 'concept'::public.curated_course_node_type, 'Nozzles, diffusers, and junctions', null, 0),
  ('0865ea87-47bc-4526-9fec-8d750d217220', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '37c70893-bfdc-45d4-afb1-88dcd8f590e6', 'concept'::public.curated_course_node_type, 'Filling and draining tanks', null, 1),
  ('265c42d9-edb0-418f-919d-75329904b538', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '37c70893-bfdc-45d4-afb1-88dcd8f590e6', 'concept'::public.curated_course_node_type, 'Multiple-inlet and multiple-outlet systems', null, 2),
  ('c7458681-bb2a-4151-b7f6-692f6438655f', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', null, 'topic'::public.curated_course_node_type, 'Control-Volume Momentum and Force Analysis', 'Momentum conservation connects fluid motion to forces on pipes, vanes, jets, and devices. This unit is where flow creates mechanical loads.', 6),
  ('5262c796-e9eb-4474-93ed-58523b1bdebd', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'c7458681-bb2a-4151-b7f6-692f6438655f', 'subtopic'::public.curated_course_node_type, 'Linear Momentum Equation', 'Students learn how momentum flux and external forces balance.', 0),
  ('5ec67a52-d3bf-4f38-9fc8-d2ef89885c03', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '5262c796-e9eb-4474-93ed-58523b1bdebd', 'concept'::public.curated_course_node_type, 'Integral momentum balance', null, 0),
  ('fad1a452-8a83-4574-9558-ad889be75829', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '5262c796-e9eb-4474-93ed-58523b1bdebd', 'concept'::public.curated_course_node_type, 'Pressure, weight, and support forces', null, 1),
  ('1aa53cc2-21a6-4741-9b63-773cc1f9c1c7', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '5262c796-e9eb-4474-93ed-58523b1bdebd', 'concept'::public.curated_course_node_type, 'Sign conventions and vector components', null, 2),
  ('c1cdd2a2-e742-4dca-978a-314cc529b4f2', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'c7458681-bb2a-4151-b7f6-692f6438655f', 'subtopic'::public.curated_course_node_type, 'Momentum Applications', 'Students calculate forces produced by changing flow direction or speed.', 1),
  ('785c7e43-ee6b-4fdf-bfef-b1cc8f68bd30', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'c1cdd2a2-e742-4dca-978a-314cc529b4f2', 'concept'::public.curated_course_node_type, 'Pipe bends and reducers', null, 0),
  ('efc98aba-30b0-4b8c-bdf3-3812323267ce', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'c1cdd2a2-e742-4dca-978a-314cc529b4f2', 'concept'::public.curated_course_node_type, 'Jets striking plates and vanes', null, 1),
  ('2aa14ee6-05be-472c-ba81-04e0711755a6', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'c1cdd2a2-e742-4dca-978a-314cc529b4f2', 'concept'::public.curated_course_node_type, 'Nozzle thrust and propulsion basics', null, 2),
  ('876c86a0-15a5-424a-a587-3d39b77cb854', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'c7458681-bb2a-4151-b7f6-692f6438655f', 'subtopic'::public.curated_course_node_type, 'Angular Momentum', 'Angular momentum provides the foundation for turbomachinery analysis.', 2),
  ('ceb78c66-99a1-46df-a282-0492592470bd', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '876c86a0-15a5-424a-a587-3d39b77cb854', 'concept'::public.curated_course_node_type, 'Moment of momentum', null, 0),
  ('1085c008-cd0e-49aa-94f9-acaff56e75c3', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '876c86a0-15a5-424a-a587-3d39b77cb854', 'concept'::public.curated_course_node_type, 'Torque on rotating devices', null, 1),
  ('de3259b3-68d5-4fbe-a70c-b729bddec595', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '876c86a0-15a5-424a-a587-3d39b77cb854', 'concept'::public.curated_course_node_type, 'Pump and turbine preview', null, 2),
  ('ea0ec9d5-fb2a-40f8-9036-0b34074b0b0e', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', null, 'topic'::public.curated_course_node_type, 'Energy Equation, Head Losses, and Hydraulic Grade Lines', 'The mechanical energy equation extends Bernoulli to real systems with losses, pumps, and turbines. Students learn to visualize energy changes along a flow path.', 7),
  ('bd7fbe63-51dd-4810-8446-5fa9f36de486', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'ea0ec9d5-fb2a-40f8-9036-0b34074b0b0e', 'subtopic'::public.curated_course_node_type, 'Mechanical Energy Equation', 'Students account for machines and irreversible losses.', 0),
  ('0f7b4089-30b3-42b0-83bd-a05e34a6fd7a', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'bd7fbe63-51dd-4810-8446-5fa9f36de486', 'concept'::public.curated_course_node_type, 'Pump head and turbine head', null, 0),
  ('4ef2bd09-84e2-4e94-863e-9f7a23e8a26a', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'bd7fbe63-51dd-4810-8446-5fa9f36de486', 'concept'::public.curated_course_node_type, 'Major and minor losses', null, 1),
  ('b44b9a51-1969-476a-ba87-8722df079dab', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'bd7fbe63-51dd-4810-8446-5fa9f36de486', 'concept'::public.curated_course_node_type, 'Energy balance between sections', null, 2),
  ('755fcf9f-39d0-4f6a-acee-0965fd6ca8cb', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'ea0ec9d5-fb2a-40f8-9036-0b34074b0b0e', 'subtopic'::public.curated_course_node_type, 'Grade Lines', 'Hydraulic and energy grade lines make pressure and energy behavior visible.', 1),
  ('f9370a3e-bd3b-4e50-807a-1db5142f5bf3', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '755fcf9f-39d0-4f6a-acee-0965fd6ca8cb', 'concept'::public.curated_course_node_type, 'Hydraulic grade line', null, 0),
  ('ec065082-580c-4f9d-8e3a-9a9caa904417', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '755fcf9f-39d0-4f6a-acee-0965fd6ca8cb', 'concept'::public.curated_course_node_type, 'Energy grade line', null, 1),
  ('631be70d-f40c-44fd-bf84-4e88ed671305', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '755fcf9f-39d0-4f6a-acee-0965fd6ca8cb', 'concept'::public.curated_course_node_type, 'Interpretation through pipes and devices', null, 2),
  ('e89bead1-394f-4ed4-bf5b-f463b1f8896f', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'ea0ec9d5-fb2a-40f8-9036-0b34074b0b0e', 'subtopic'::public.curated_course_node_type, 'System Analysis', 'Students apply the equation to realistic fluid systems.', 2),
  ('cbd8630d-66c8-4e94-9c3a-20b454539d35', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'e89bead1-394f-4ed4-bf5b-f463b1f8896f', 'concept'::public.curated_course_node_type, 'Reservoir-to-reservoir flow', null, 0),
  ('bf57ab63-8865-407c-b7be-43e1c3ed899a', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'e89bead1-394f-4ed4-bf5b-f463b1f8896f', 'concept'::public.curated_course_node_type, 'Pump-assisted systems', null, 1),
  ('3f5bb56c-38d0-4697-b55f-db5412fe7b2c', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'e89bead1-394f-4ed4-bf5b-f463b1f8896f', 'concept'::public.curated_course_node_type, 'Siphons and cavitation risk', null, 2),
  ('3e702020-8045-482e-be20-af015c0978a7', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', null, 'topic'::public.curated_course_node_type, 'Dimensional Analysis, Similitude, and Model Testing', 'Dimensional analysis reduces complex flow problems to meaningful nondimensional groups. It also lets engineers test scaled models and transfer results to full-size systems.', 8),
  ('a0357d9e-a09a-42ae-b308-0e82b32f87f1', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '3e702020-8045-482e-be20-af015c0978a7', 'subtopic'::public.curated_course_node_type, 'Dimensions and Buckingham Pi', 'Students learn how variables combine into dimensionless parameters.', 0),
  ('d5156cde-c7d4-4257-b581-9102a3a24953', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'a0357d9e-a09a-42ae-b308-0e82b32f87f1', 'concept'::public.curated_course_node_type, 'Fundamental dimensions', null, 0),
  ('dfffc5d9-3126-4c1c-8084-42b081f6b1fb', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'a0357d9e-a09a-42ae-b308-0e82b32f87f1', 'concept'::public.curated_course_node_type, 'Buckingham Pi theorem', null, 1),
  ('491e2b54-5dcd-4e0e-8e4b-d11417672fb5', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'a0357d9e-a09a-42ae-b308-0e82b32f87f1', 'concept'::public.curated_course_node_type, 'Selecting repeating variables', null, 2),
  ('cd2ca1a3-4dcf-4ea0-9639-17bbc2c3006f', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '3e702020-8045-482e-be20-af015c0978a7', 'subtopic'::public.curated_course_node_type, 'Important Dimensionless Numbers', 'Dimensionless numbers compare competing physical effects.', 1),
  ('9e8a6772-efff-4849-80a1-216b02afc46e', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'cd2ca1a3-4dcf-4ea0-9639-17bbc2c3006f', 'concept'::public.curated_course_node_type, 'Reynolds, Froude, Euler, Mach, and Weber numbers', null, 0),
  ('447799b7-635a-403a-bb28-57e47cdc3269', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'cd2ca1a3-4dcf-4ea0-9639-17bbc2c3006f', 'concept'::public.curated_course_node_type, 'Physical interpretation', null, 1),
  ('e6722db9-8298-4801-a9fd-6db816bf891c', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'cd2ca1a3-4dcf-4ea0-9639-17bbc2c3006f', 'concept'::public.curated_course_node_type, 'Regime identification', null, 2),
  ('bb9226f6-3126-487f-a1bb-e9de179c852c', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '3e702020-8045-482e-be20-af015c0978a7', 'subtopic'::public.curated_course_node_type, 'Similitude and Scaling', 'Students learn how model tests represent prototypes.', 2),
  ('b829fa7b-757a-4cf8-87b7-75be4ff8f016', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'bb9226f6-3126-487f-a1bb-e9de179c852c', 'concept'::public.curated_course_node_type, 'Geometric, kinematic, and dynamic similarity', null, 0),
  ('9a2ff418-d834-44f8-852c-35169e81c69a', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'bb9226f6-3126-487f-a1bb-e9de179c852c', 'concept'::public.curated_course_node_type, 'Scale effects', null, 1),
  ('b1342659-545b-4035-91f8-b2126e396f5f', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'bb9226f6-3126-487f-a1bb-e9de179c852c', 'concept'::public.curated_course_node_type, 'Wind-tunnel, water-channel, and hydraulic-model examples', null, 2),
  ('54fff714-203c-4ad2-93aa-704fcced7f85', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', null, 'topic'::public.curated_course_node_type, 'Internal Flow: Laminar and Turbulent Pipe Flow', 'Internal flow focuses on fluids confined by walls. Students learn how viscosity, turbulence, and roughness determine pressure loss.', 9),
  ('4e198b29-2cef-4d5a-9a87-f59015f36f4d', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '54fff714-203c-4ad2-93aa-704fcced7f85', 'subtopic'::public.curated_course_node_type, 'Fully Developed Pipe Flow', 'Students learn the structure of laminar and turbulent velocity profiles.', 0),
  ('21970fbb-f9ed-4981-a981-8c0cfb987c65', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '4e198b29-2cef-4d5a-9a87-f59015f36f4d', 'concept'::public.curated_course_node_type, 'Entrance length', null, 0),
  ('f14103fc-9913-430b-98a0-c66dfe9069d9', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '4e198b29-2cef-4d5a-9a87-f59015f36f4d', 'concept'::public.curated_course_node_type, 'Laminar parabolic profile', null, 1),
  ('8a3640de-d2b5-44bc-8736-9af6ee9d5dd0', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '4e198b29-2cef-4d5a-9a87-f59015f36f4d', 'concept'::public.curated_course_node_type, 'Mean velocity and wall shear', null, 2),
  ('b138d042-4950-46b9-8696-80dc0a0c7acf', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '54fff714-203c-4ad2-93aa-704fcced7f85', 'subtopic'::public.curated_course_node_type, 'Reynolds Number and Flow Regimes', 'Reynolds number predicts whether viscous or inertial behavior dominates.', 1),
  ('d81a1ee1-0eb5-49e8-88a5-bc5ee7414231', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'b138d042-4950-46b9-8696-80dc0a0c7acf', 'concept'::public.curated_course_node_type, 'Laminar, transitional, and turbulent regimes', null, 0),
  ('ca6290bc-3c3b-4330-af13-e51ebf17db1e', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'b138d042-4950-46b9-8696-80dc0a0c7acf', 'concept'::public.curated_course_node_type, 'Critical Reynolds number', null, 1),
  ('1e88832c-bd27-4c27-b8c3-2d65e173cf18', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'b138d042-4950-46b9-8696-80dc0a0c7acf', 'concept'::public.curated_course_node_type, 'Physical meaning of turbulence', null, 2),
  ('4e17b9af-42b8-4aeb-81e5-51e37f9e87c8', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '54fff714-203c-4ad2-93aa-704fcced7f85', 'subtopic'::public.curated_course_node_type, 'Friction Losses', 'Students quantify pressure drop in pipes.', 2),
  ('b14d02fa-6489-4c8d-8b1c-614c758c355f', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '4e17b9af-42b8-4aeb-81e5-51e37f9e87c8', 'concept'::public.curated_course_node_type, 'Darcy-Weisbach equation', null, 0),
  ('efd2da6b-c153-4472-b334-20aaae0e3208', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '4e17b9af-42b8-4aeb-81e5-51e37f9e87c8', 'concept'::public.curated_course_node_type, 'Friction factor and Moody chart', null, 1),
  ('31a0c7c5-a5c9-470d-a6b9-2c405498c1da', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '4e17b9af-42b8-4aeb-81e5-51e37f9e87c8', 'concept'::public.curated_course_node_type, 'Relative roughness', null, 2),
  ('f72beef4-461a-4914-9454-9fd1dd45fce3', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', null, 'topic'::public.curated_course_node_type, 'Pipe Systems, Pumps, Turbines, and Flow Measurement', 'This unit turns pipe-flow fundamentals into engineering-system analysis. Students learn how components interact and how flow is measured and moved.', 10),
  ('9033a0e6-5aff-42fe-ab89-f46d89d95161', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'f72beef4-461a-4914-9454-9fd1dd45fce3', 'subtopic'::public.curated_course_node_type, 'Pipe Networks and Minor Losses', 'Students analyze systems with fittings, branches, and multiple pipes.', 0),
  ('aa2f0c92-77b9-4108-b13f-5e5910657ef5', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '9033a0e6-5aff-42fe-ab89-f46d89d95161', 'concept'::public.curated_course_node_type, 'Loss coefficients', null, 0),
  ('240ae628-651d-478d-92f4-663af0365341', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '9033a0e6-5aff-42fe-ab89-f46d89d95161', 'concept'::public.curated_course_node_type, 'Series and parallel pipes', null, 1),
  ('6d02c403-cccd-41bf-825d-ced4e413c9e9', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '9033a0e6-5aff-42fe-ab89-f46d89d95161', 'concept'::public.curated_course_node_type, 'Network balancing overview', null, 2),
  ('12039795-189a-4389-a1c3-cd1eda6566ee', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'f72beef4-461a-4914-9454-9fd1dd45fce3', 'subtopic'::public.curated_course_node_type, 'Pumps and Turbines', 'Students learn how machines add or remove energy from fluids.', 1),
  ('1d854588-4d0a-46c9-8b95-a591a470143b', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '12039795-189a-4389-a1c3-cd1eda6566ee', 'concept'::public.curated_course_node_type, 'Pump curves and system curves', null, 0),
  ('9cc6482e-7e64-4bb9-8544-e37ae4ac130a', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '12039795-189a-4389-a1c3-cd1eda6566ee', 'concept'::public.curated_course_node_type, 'Operating point', null, 1),
  ('ecdb1dc8-77f0-4d17-9c23-066b4430653b', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '12039795-189a-4389-a1c3-cd1eda6566ee', 'concept'::public.curated_course_node_type, 'Efficiency, power, and cavitation', null, 2),
  ('dd26695e-2310-4170-a1a4-f8c390869ed1', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'f72beef4-461a-4914-9454-9fd1dd45fce3', 'subtopic'::public.curated_course_node_type, 'Flow Measurement', 'Students compare common measurement techniques and their limitations.', 2),
  ('d1eb7837-7e1d-45e2-bd33-e097c4a4e123', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'dd26695e-2310-4170-a1a4-f8c390869ed1', 'concept'::public.curated_course_node_type, 'Venturi, orifice, and nozzle meters', null, 0),
  ('ef5bba0e-4a9d-4474-af9c-fec333111123', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'dd26695e-2310-4170-a1a4-f8c390869ed1', 'concept'::public.curated_course_node_type, 'Pitot-static tubes', null, 1),
  ('c4a48885-aee2-44a4-82a9-f4eb8e8edaf3', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'dd26695e-2310-4170-a1a4-f8c390869ed1', 'concept'::public.curated_course_node_type, 'Rotameters, transducers, and calibration', null, 2),
  ('b1c353a5-8d6a-486c-924a-9bc789784343', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', null, 'topic'::public.curated_course_node_type, 'External Flow, Drag, Lift, and Boundary Layers', 'External flow studies fluid moving around bodies. Students learn how viscous boundary layers create drag, separation, and lift-related effects.', 11),
  ('e243d212-5296-42ac-876b-74b42fceed17', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'b1c353a5-8d6a-486c-924a-9bc789784343', 'subtopic'::public.curated_course_node_type, 'Boundary Layer Fundamentals', 'Students learn how no-slip behavior creates a thin viscous region near surfaces.', 0),
  ('b6876deb-8f1b-4420-9dec-a2bc11819053', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'e243d212-5296-42ac-876b-74b42fceed17', 'concept'::public.curated_course_node_type, 'No-slip condition', null, 0),
  ('00da6806-3c0e-4cb8-9cb5-17768031df16', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'e243d212-5296-42ac-876b-74b42fceed17', 'concept'::public.curated_course_node_type, 'Laminar and turbulent boundary layers', null, 1),
  ('ff3f13c7-2beb-42e8-9235-294456f90c50', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'e243d212-5296-42ac-876b-74b42fceed17', 'concept'::public.curated_course_node_type, 'Boundary-layer thickness', null, 2),
  ('eb271e53-7429-41ae-b2c8-f3ee1ac2964b', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'b1c353a5-8d6a-486c-924a-9bc789784343', 'subtopic'::public.curated_course_node_type, 'Drag', 'Students learn how shape, skin friction, and separation determine resistance.', 1),
  ('94e2376d-5ef0-41ab-aa4a-0022e284bb7f', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'eb271e53-7429-41ae-b2c8-f3ee1ac2964b', 'concept'::public.curated_course_node_type, 'Pressure drag and skin-friction drag', null, 0),
  ('f2b08679-8d63-4186-a7ff-61c04cebf506', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'eb271e53-7429-41ae-b2c8-f3ee1ac2964b', 'concept'::public.curated_course_node_type, 'Drag coefficient', null, 1),
  ('a80d5b32-900f-46c4-8622-38cfff204bfe', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'eb271e53-7429-41ae-b2c8-f3ee1ac2964b', 'concept'::public.curated_course_node_type, 'Flow separation and streamlining', null, 2),
  ('d9514285-e450-48d8-af4d-60375659fa14', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'b1c353a5-8d6a-486c-924a-9bc789784343', 'subtopic'::public.curated_course_node_type, 'Lift and Flow Around Bodies', 'Students gain a foundational view of lift and fluid forces on engineering shapes.', 2),
  ('1d50a474-97c9-4f54-b358-a1d232518bc5', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'd9514285-e450-48d8-af4d-60375659fa14', 'concept'::public.curated_course_node_type, 'Lift coefficient', null, 0),
  ('a48e2929-ce81-449a-9c4c-7e27e9c54156', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'd9514285-e450-48d8-af4d-60375659fa14', 'concept'::public.curated_course_node_type, 'Airfoils and circulation overview', null, 1),
  ('5067cfac-2824-4e7c-9499-b0bf1855ebaa', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'd9514285-e450-48d8-af4d-60375659fa14', 'concept'::public.curated_course_node_type, 'Bluff bodies and practical examples', null, 2),
  ('5b28d298-aa36-4757-9bd9-d63802ce22aa', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', null, 'topic'::public.curated_course_node_type, 'Open-Channel Flow and Introductory Compressible Flow', 'This unit introduces two important regimes beyond closed-pipe incompressible flow: free-surface hydraulics and flows where density changes matter.', 12),
  ('e8f5d984-4e0c-4309-9453-3216da3fe6c7', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '5b28d298-aa36-4757-9bd9-d63802ce22aa', 'subtopic'::public.curated_course_node_type, 'Open-Channel Flow Concepts', 'Students learn how gravity and free surfaces shape channel flow.', 0),
  ('f8ea107f-4be9-480a-94de-6a3683881e66', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'e8f5d984-4e0c-4309-9453-3216da3fe6c7', 'concept'::public.curated_course_node_type, 'Depth, velocity, and discharge', null, 0),
  ('15fe45ef-ba1d-47e3-853b-c734db12d58d', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'e8f5d984-4e0c-4309-9453-3216da3fe6c7', 'concept'::public.curated_course_node_type, 'Specific energy', null, 1),
  ('e3c3cd66-00be-4bc8-aa73-33a4ff1e80bb', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'e8f5d984-4e0c-4309-9453-3216da3fe6c7', 'concept'::public.curated_course_node_type, 'Subcritical, critical, and supercritical flow', null, 2),
  ('c1cacba9-43cd-4bad-bbc0-1d4d3a58d79f', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '5b28d298-aa36-4757-9bd9-d63802ce22aa', 'subtopic'::public.curated_course_node_type, 'Uniform and Rapidly Varied Flow', 'Students survey common hydraulic calculations and transitions.', 1),
  ('c2e192af-75db-4ba1-aaab-3e10aaae3bd2', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'c1cacba9-43cd-4bad-bbc0-1d4d3a58d79f', 'concept'::public.curated_course_node_type, 'Manning equation', null, 0),
  ('dd984b9d-20ce-41a5-8173-5d8e7fffd5fe', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'c1cacba9-43cd-4bad-bbc0-1d4d3a58d79f', 'concept'::public.curated_course_node_type, 'Hydraulic jump', null, 1),
  ('2f36da02-c3e5-424c-816d-0736ae2d617e', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'c1cacba9-43cd-4bad-bbc0-1d4d3a58d79f', 'concept'::public.curated_course_node_type, 'Weirs and spillways overview', null, 2),
  ('2e1a50be-a0fa-4954-b93b-a62222dacb1f', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '5b28d298-aa36-4757-9bd9-d63802ce22aa', 'subtopic'::public.curated_course_node_type, 'Compressible Flow Introduction', 'Students learn when gas density changes can no longer be ignored.', 2),
  ('ae9f599f-1c3c-4e5e-afe5-69bdbeab3f29', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '2e1a50be-a0fa-4954-b93b-a62222dacb1f', 'concept'::public.curated_course_node_type, 'Mach number', null, 0),
  ('e9a81564-62f4-40d8-8d57-82142f8cb85a', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '2e1a50be-a0fa-4954-b93b-a62222dacb1f', 'concept'::public.curated_course_node_type, 'Speed of sound', null, 1),
  ('a5685f90-6c20-4e80-8489-4eac9b47e707', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '2e1a50be-a0fa-4954-b93b-a62222dacb1f', 'concept'::public.curated_course_node_type, 'Choking and shock-wave overview', null, 2),
  ('eef41e06-ff00-419a-b539-8f6b170de32c', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', null, 'topic'::public.curated_course_node_type, 'Integrated Fluid Mechanics Laboratory and Applications', 'The final unit consolidates the course through measurement, uncertainty, and cross-disciplinary applications. Students practice explaining not only what the equations predict, but whether the result is credible.', 13),
  ('1078f466-80c7-47c7-9225-01cd0bf76761', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'eef41e06-ff00-419a-b539-8f6b170de32c', 'subtopic'::public.curated_course_node_type, 'Experimental Methods and Data Quality', 'Students learn how fluid quantities are measured and how uncertainty affects conclusions.', 0),
  ('fe505bae-87dc-4374-b7b5-575deb4e62a7', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '1078f466-80c7-47c7-9225-01cd0bf76761', 'concept'::public.curated_course_node_type, 'Pressure, velocity, and flow-rate measurement', null, 0),
  ('f40b0858-8301-4303-9ad7-dd01a5706483', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '1078f466-80c7-47c7-9225-01cd0bf76761', 'concept'::public.curated_course_node_type, 'Calibration and uncertainty', null, 1),
  ('6f561e8d-9c25-4820-b33e-4661da88707c', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '1078f466-80c7-47c7-9225-01cd0bf76761', 'concept'::public.curated_course_node_type, 'Data reduction and plotting', null, 2),
  ('da7676cd-c7cb-4063-a780-3d1e3629a18b', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'eef41e06-ff00-419a-b539-8f6b170de32c', 'subtopic'::public.curated_course_node_type, 'Integrated Engineering Applications', 'Students connect core methods to real systems.', 1),
  ('b31b24d7-83d5-46d5-9afd-9313dd3d5975', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'da7676cd-c7cb-4063-a780-3d1e3629a18b', 'concept'::public.curated_course_node_type, 'Hydraulic, mechanical, and process systems', null, 0),
  ('84a4037a-9066-492c-8876-85e37383aaa9', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'da7676cd-c7cb-4063-a780-3d1e3629a18b', 'concept'::public.curated_course_node_type, 'Aerodynamic and biofluid examples', null, 1),
  ('191b97a1-7906-4e03-bf63-1a5a91c1ca6b', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'da7676cd-c7cb-4063-a780-3d1e3629a18b', 'concept'::public.curated_course_node_type, 'Energy, environmental, and transport applications', null, 2),
  ('7241c437-1cde-4037-84f1-d39d3fdd6f19', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'eef41e06-ff00-419a-b539-8f6b170de32c', 'subtopic'::public.curated_course_node_type, 'Model Validation and Communication', 'Students learn to present a fluid analysis as an engineering argument.', 2),
  ('9700812b-d343-40c9-a73e-9c055d0f0a05', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '7241c437-1cde-4037-84f1-d39d3fdd6f19', 'concept'::public.curated_course_node_type, 'Assumptions and limitations', null, 0),
  ('f40f5125-1d30-4e3a-82c1-0b84006fbcb1', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '7241c437-1cde-4037-84f1-d39d3fdd6f19', 'concept'::public.curated_course_node_type, 'Comparison of theory, experiment, and simulation', null, 1),
  ('3c04e163-5fdc-48ca-9777-17eef5ebccdd', '01c19e0a-b2a7-4807-88b7-fba3475c10aa', '7241c437-1cde-4037-84f1-d39d3fdd6f19', 'concept'::public.curated_course_node_type, 'Clear diagrams, calculations, and conclusions', null, 2);

-- Curated videos
insert into public.curated_course_videos (id, node_id, sort_order, title, channel, duration_seconds, url, thumbnail_url, annotation)
values
  ('6ee381c8-10f5-40b8-a25d-ecc68fc62c3d', '430e8be6-4855-4c09-8375-bcde2a35bd4d', 0, 'What Is a Fluid? Course Overview', 'Engineering Foundations', 522, '#', null, 'Start here — sets up the whole course.'),
  ('21b20518-2b54-43a7-be48-8fd8be7dea56', '430e8be6-4855-4c09-8375-bcde2a35bd4d', 1, 'Solids vs Liquids vs Gases', 'PhysicsHub', 665, '#', null, null),
  ('d39c6b16-bb93-4212-bb69-905a466136db', '3b074c3e-579c-4d6e-9685-6b2932c37fc1', 0, 'The Continuum Hypothesis Explained', 'PhysicsHub', 571, '#', null, null),
  ('74cfe1e7-dcca-498a-a7c7-8e8c51315286', '3b074c3e-579c-4d6e-9685-6b2932c37fc1', 1, 'System, Control Mass, and Control Volume', 'Engineering Foundations', 738, '#', null, null),
  ('9a0a6780-bd78-45e9-8731-37bab6650607', 'fe9d7f86-d7eb-4356-866c-e4a881c17966', 0, 'Density, Specific Weight & Specific Gravity', 'Engineering Foundations', 614, '#', null, null),
  ('97f1cd9d-5c54-4c2e-adbd-5339878d9386', 'fe9d7f86-d7eb-4356-866c-e4a881c17966', 1, 'Viscosity and Newtonian Fluids', 'FlowLab', 827, '#', null, null),
  ('e3d6b5cc-2a0b-4b8f-b89a-4c180944e8f7', 'fe9d7f86-d7eb-4356-866c-e4a881c17966', 2, 'Surface Tension & Vapor Pressure', 'PhysicsHub', 596, '#', null, null),
  ('587461fe-6146-4e8e-a197-583ab1f3555a', '0578da66-6eb4-447b-9b16-afe7dcc2aaf3', 0, 'SI vs US Customary Units in Fluids', 'Engineering Foundations', 442, '#', null, null),
  ('80841d30-3f3d-43fc-abfe-929cb3f1ab19', '0578da66-6eb4-447b-9b16-afe7dcc2aaf3', 1, 'Dimensional Homogeneity & Unit Checks', 'FlowLab', 529, '#', null, null),
  ('f83b75c3-597f-4dcc-a15a-8ded8fd029c7', '3595476d-b73c-436a-9982-585398b29fc0', 0, 'Complete Introduction to Fluid Statics', 'FlowLab', 873, '#', null, 'Synthesizes the entire unit.'),
  ('6043b615-12f2-4703-8016-95730ec6f2c1', '3595476d-b73c-436a-9982-585398b29fc0', 1, 'Fluid Statics Worked Examples', 'Engineering Foundations', 1087, '#', null, null),
  ('1f90bf90-7852-4d83-8ba3-aec65b164199', 'cee132d9-cc38-47ec-b1d1-b1cc3776213c', 0, 'Absolute vs Gauge vs Vacuum Pressure', 'FlowLab', 641, '#', null, null),
  ('c99fde5c-297c-4bfa-965f-31c62f331ac4', 'cee132d9-cc38-47ec-b1d1-b1cc3776213c', 1, 'Pressure at a Point (Pascal''s Law)', 'PhysicsHub', 776, '#', null, null),
  ('93cd169e-44c0-4a32-b8a9-e3d44f18dec8', 'cee132d9-cc38-47ec-b1d1-b1cc3776213c', 2, 'Pascal''s Law and Hydraulic Systems', 'Engineering Foundations', 558, '#', null, null),
  ('227dce55-9d79-4833-b520-48422ecac0c5', '3289ae82-918e-47c8-95cf-33560a757ec6', 0, 'Deriving the Hydrostatic Equation', 'FlowLab', 802, '#', null, null),
  ('3647cb1d-da8a-42ab-b2c6-2aa671f89723', '3289ae82-918e-47c8-95cf-33560a757ec6', 1, 'Pressure in Constant-Density Liquids', 'Engineering Foundations', 524, '#', null, null),
  ('66605321-3c34-4614-ab42-5d2e469ca021', '3289ae82-918e-47c8-95cf-33560a757ec6', 2, 'Pressure in the Compressible Atmosphere', 'PhysicsHub', 697, '#', null, null),
  ('06d4110c-016c-4074-b87b-c904b3dfaea6', 'eb8fef1b-4f30-479c-b5de-b11bf7c7178a', 0, 'Piezometers and Manometers', 'FlowLab', 723, '#', null, null),
  ('572aca18-2140-4f5a-abb1-347028010fde', 'eb8fef1b-4f30-479c-b5de-b11bf7c7178a', 1, 'Differential Manometers Explained', 'Engineering Foundations', 629, '#', null, null),
  ('3af8f8a8-ad2a-491d-a0bd-71c87386c1cb', 'eb8fef1b-4f30-479c-b5de-b11bf7c7178a', 2, 'Barometers and Pressure Transducers', 'PhysicsHub', 551, '#', null, null),
  ('9f632a49-3994-49d4-b83e-aadd123e6ee8', '7ad45f46-aaa3-4e69-9edb-d7a99439e7e7', 0, 'Hydrostatic Forces & Buoyancy Overview', 'FlowLab', 948, '#', null, null),
  ('4f5b9e06-1cd4-4a1c-acf5-3bb3e749cdf0', 'fe5bccc0-560b-4365-ac22-497bca0455aa', 0, 'Hydrostatic Force on a Plane Surface', 'Engineering Foundations', 835, '#', null, null),
  ('cbf48520-f1ef-4846-aa97-7e7093959b31', 'fe5bccc0-560b-4365-ac22-497bca0455aa', 1, 'Center of Pressure Calculations', 'FlowLab', 680, '#', null, null),
  ('7833debb-2eb0-4af4-805a-15933f2516e6', 'fe5bccc0-560b-4365-ac22-497bca0455aa', 2, 'Forces on Curved Surfaces', 'PhysicsHub', 761, '#', null, null),
  ('2c426837-794e-400b-a43c-32c752d086cd', '93228295-8dfa-4bdc-9bb7-37cfbc30446c', 0, 'Archimedes'' Principle Derived', 'PhysicsHub', 608, '#', null, null),
  ('1a37e18b-e66e-4d7f-bd3d-1a35438db652', '93228295-8dfa-4bdc-9bb7-37cfbc30446c', 1, 'Submerged vs Floating Bodies', 'FlowLab', 587, '#', null, null),
  ('35c1a0d9-f12f-4c92-a3df-389d6bae32fd', 'f9eb5fb1-ee0e-476b-8681-c1835875e332', 0, 'Metacentric Height and Ship Stability', 'Engineering Foundations', 852, '#', null, null),
  ('07edcb6f-16f9-4303-abb9-5e7f10c6c411', 'f9eb5fb1-ee0e-476b-8681-c1835875e332', 1, 'Stable, Unstable & Neutral Equilibrium', 'FlowLab', 513, '#', null, null),
  ('34c8887e-9ac7-4547-8a20-843f64acde34', 'd6fdbd88-a8da-45ae-bfb8-70d6f1a1ddf4', 0, 'Describing Fluid Motion: Kinematics', 'FlowLab', 747, '#', null, null),
  ('58c07ff1-4f24-4a8f-b13a-c32b866ce80a', '1a2dc489-0854-4151-9602-9bd2476edd9b', 0, 'Steady vs Unsteady, Uniform vs Nonuniform', 'Engineering Foundations', 652, '#', null, null),
  ('a8f19463-f377-4c53-9e90-2399729a2d28', '6b7bab11-1eb1-4e96-ba63-b0e722e9c775', 0, 'Streamlines, Pathlines & Streaklines', 'PhysicsHub', 704, '#', null, null),
  ('0379e818-b21e-4f40-9ba6-a604bf6a65b3', '6b7bab11-1eb1-4e96-ba63-b0e722e9c775', 1, 'The Material Derivative', 'FlowLab', 789, '#', null, null),
  ('fcf66968-f91d-47e1-a17f-bc6abcdc2ce2', 'd84f2b47-d5ea-4627-92ba-2895b9104d57', 0, 'Vorticity and Rotation Basics', 'PhysicsHub', 616, '#', null, null),
  ('acd8d0c7-26a6-4899-ba24-c17873db7f54', '9c686452-e525-48f3-9e33-eb868e8c6638', 0, 'Bernoulli''s Equation from Scratch', 'FlowLab', 982, '#', null, null),
  ('a60ef7df-8720-4705-b8f6-ff788599b6db', '9c686452-e525-48f3-9e33-eb868e8c6638', 1, 'Why Bernoulli Fails: Common Mistakes', 'Engineering Foundations', 768, '#', null, null),
  ('d07f87b9-7470-4956-a0e4-754362c0492f', '1e66a059-edac-41c9-8192-17870917ba11', 0, 'Steady, Incompressible, Inviscid: The Assumptions', 'PhysicsHub', 691, '#', null, null),
  ('c2885594-1036-49be-ab3a-3c620d708769', 'ecb38c12-6998-460f-ae86-d07cae7a7cac', 0, 'Venturi Meters and Pitot Tubes', 'FlowLab', 838, '#', null, null),
  ('0fdb645d-6d74-470a-ab20-b75ac2a552a9', 'ecb38c12-6998-460f-ae86-d07cae7a7cac', 1, 'Nozzles, Diffusers, Jets and Siphons', 'Engineering Foundations', 731, '#', null, null),
  ('c08c29a4-85eb-4be2-bf1e-f0a5df20f67c', '26848c66-e7ba-45ae-8cdf-b2cf992e53bd', 0, 'Static, Dynamic & Stagnation Pressure', 'PhysicsHub', 637, '#', null, null),
  ('9e9e3b40-049b-48ab-8818-c7a6a4117b76', '0b32d4a9-9818-4442-b72b-f4d5cf011483', 0, 'The Control Volume Approach', 'FlowLab', 794, '#', null, null),
  ('7f2bf6f8-66c8-4941-835f-88d4e10ed32c', '0c6b5b5c-2b7a-42fb-88eb-dc1e532e77c5', 0, 'Drawing Control Surfaces', 'Engineering Foundations', 584, '#', null, null),
  ('e2ba812c-d731-474c-886e-870b916d38ea', 'd336b20c-dd9e-446e-978d-1ffd239ebb59', 0, 'Deriving the Continuity Equation', 'FlowLab', 722, '#', null, null),
  ('12266dfe-ab68-41bc-bb0d-7dd77bff1c44', 'd336b20c-dd9e-446e-978d-1ffd239ebb59', 1, 'Incompressible vs Compressible Continuity', 'PhysicsHub', 626, '#', null, null),
  ('a75ff872-6b8d-4de5-8422-c8abb1c8df29', '37c70893-bfdc-45d4-afb1-88dcd8f590e6', 0, 'Filling and Draining Tanks', 'Engineering Foundations', 679, '#', null, null),
  ('3a4fb236-ba75-439a-bc46-7f0debd80221', 'c7458681-bb2a-4151-b7f6-692f6438655f', 0, 'Momentum Equation for Control Volumes', 'FlowLab', 931, '#', null, null),
  ('85b96cdd-cf9a-4388-bb77-65c0847f5d29', '5262c796-e9eb-4474-93ed-58523b1bdebd', 0, 'Setting Up the Momentum Balance', 'Engineering Foundations', 787, '#', null, null),
  ('d67a19e3-2552-43b9-88b7-c687f88d28dc', 'c1cdd2a2-e742-4dca-978a-314cc529b4f2', 0, 'Force on Pipe Bends and Reducers', 'FlowLab', 773, '#', null, null),
  ('3f0c2bab-d85b-4dac-ad50-500cc4ac321a', 'c1cdd2a2-e742-4dca-978a-314cc529b4f2', 1, 'Jets Striking Plates and Vanes', 'PhysicsHub', 702, '#', null, null),
  ('fdf03fe4-7b3e-4eaf-b928-677f8e0347be', '876c86a0-15a5-424a-a587-3d39b77cb854', 0, 'Moment of Momentum & Turbomachines', 'Engineering Foundations', 816, '#', null, null),
  ('3d363610-28d1-498c-8b5d-aeac8da755e6', 'ea0ec9d5-fb2a-40f8-9036-0b34074b0b0e', 0, 'The Extended Energy Equation', 'FlowLab', 889, '#', null, null),
  ('3699658f-c4c6-4156-88a7-e353e19d0ce7', 'bd7fbe63-51dd-4810-8446-5fa9f36de486', 0, 'Pump Head, Turbine Head & Losses', 'Engineering Foundations', 758, '#', null, null),
  ('f23ceb8a-2b20-4bd9-b935-e84da556ff40', '755fcf9f-39d0-4f6a-acee-0965fd6ca8cb', 0, 'Hydraulic and Energy Grade Lines', 'FlowLab', 715, '#', null, null),
  ('36b3ac89-e11c-4a0a-b7bc-2d232535fff4', 'e89bead1-394f-4ed4-bf5b-f463b1f8896f', 0, 'Reservoir-to-Reservoir Flow', 'PhysicsHub', 644, '#', null, null),
  ('fc2dbd04-693b-447e-946b-5aefcc774f1c', 'e89bead1-394f-4ed4-bf5b-f463b1f8896f', 1, 'Cavitation Risk in Pump Systems', 'Engineering Foundations', 598, '#', null, null),
  ('e801fe9a-3301-40bf-b229-d92f76110a05', '3e702020-8045-482e-be20-af015c0978a7', 0, 'Dimensional Analysis & Similitude Overview', 'FlowLab', 912, '#', null, null),
  ('e9fbe4ae-636e-44e5-b2fc-15a1f25c70d2', 'a0357d9e-a09a-42ae-b308-0e82b32f87f1', 0, 'The Buckingham Pi Theorem, Step by Step', 'Engineering Foundations', 964, '#', null, null),
  ('aefa91da-6ffc-48cc-b22f-8f8007ff75e2', 'cd2ca1a3-4dcf-4ea0-9639-17bbc2c3006f', 0, 'Reynolds, Froude, Euler, Mach & Weber', 'FlowLab', 821, '#', null, null),
  ('b2b2c52d-e00e-4601-aa56-d0dc4fe72654', 'bb9226f6-3126-487f-a1bb-e9de179c852c', 0, 'Geometric, Kinematic & Dynamic Similarity', 'PhysicsHub', 739, '#', null, null),
  ('6f23c2ef-39dc-4e18-ae2f-f2ad2190f7e9', '54fff714-203c-4ad2-93aa-704fcced7f85', 0, 'Pipe Flow: Laminar to Turbulent', 'FlowLab', 867, '#', null, null),
  ('8e1c06af-a323-4780-a29c-dd17b94180bc', '4e198b29-2cef-4d5a-9a87-f59015f36f4d', 0, 'Entrance Length & Velocity Profiles', 'Engineering Foundations', 753, '#', null, null),
  ('defb4867-5a29-48e5-9bd5-5e917bb8f2a7', 'b138d042-4950-46b9-8696-80dc0a0c7acf', 0, 'Reynolds'' Experiment Recreated', 'PhysicsHub', 649, '#', null, null),
  ('642dafd4-6b3d-44ce-b1a4-0a66e444ebae', 'b138d042-4950-46b9-8696-80dc0a0c7acf', 1, 'Critical Reynolds Number', 'FlowLab', 562, '#', null, null),
  ('0e1a22c9-116f-4c80-8361-4158b6d6da21', '4e17b9af-42b8-4aeb-81e5-51e37f9e87c8', 0, 'Darcy-Weisbach and the Moody Chart', 'Engineering Foundations', 918, '#', null, null),
  ('d6171e3a-bfc8-4e82-902c-e075ec250de4', 'f72beef4-461a-4914-9454-9fd1dd45fce3', 0, 'Pipe Systems and Turbomachinery Overview', 'FlowLab', 843, '#', null, null),
  ('78555d7d-6b15-4e06-82d8-479b498dc1d9', '9033a0e6-5aff-42fe-ab89-f46d89d95161', 0, 'Minor Losses and Loss Coefficients', 'Engineering Foundations', 767, '#', null, null),
  ('93a6130e-e80c-4738-aa5e-42a3d0bb756c', '9033a0e6-5aff-42fe-ab89-f46d89d95161', 1, 'Series and Parallel Pipes', 'PhysicsHub', 668, '#', null, null),
  ('f3eedce2-bfec-4074-bd33-9eec2699c3d1', '12039795-189a-4389-a1c3-cd1eda6566ee', 0, 'Pump Curves and Operating Point', 'FlowLab', 809, '#', null, null),
  ('1f2253ad-5183-4441-a29b-7b31afc4a58b', 'dd26695e-2310-4170-a1a4-f8c390869ed1', 0, 'Venturi, Orifice & Nozzle Meters', 'Engineering Foundations', 736, '#', null, null),
  ('1f3645d3-5156-4846-bab4-5ac458b53648', 'b1c353a5-8d6a-486c-924a-9bc789784343', 0, 'Boundary Layers, Drag and Lift Overview', 'FlowLab', 944, '#', null, null),
  ('3ae55a81-3ae5-42bf-b582-e57c4e3a4120', 'e243d212-5296-42ac-876b-74b42fceed17', 0, 'The No-Slip Condition & Boundary Layers', 'PhysicsHub', 751, '#', null, null),
  ('3fecd4a1-1d56-4197-ab6e-9361d17f7b40', 'eb271e53-7429-41ae-b2c8-f3ee1ac2964b', 0, 'Pressure Drag vs Skin-Friction Drag', 'Engineering Foundations', 717, '#', null, null),
  ('189ca943-e746-40c1-97f8-0b181154dcae', 'eb271e53-7429-41ae-b2c8-f3ee1ac2964b', 1, 'Flow Separation and Streamlining', 'FlowLab', 624, '#', null, null),
  ('58bcc593-7743-403c-bfe3-4772d1a5c77c', 'd9514285-e450-48d8-af4d-60375659fa14', 0, 'How Airfoils Generate Lift', 'PhysicsHub', 792, '#', null, null),
  ('5da0aee7-67bd-4d93-9b36-08a54faad340', '5b28d298-aa36-4757-9bd9-d63802ce22aa', 0, 'Open-Channel and Compressible Flow Intro', 'FlowLab', 878, '#', null, null),
  ('1349f1ad-d794-4f76-9b8b-26dc633d2b52', 'e8f5d984-4e0c-4309-9453-3216da3fe6c7', 0, 'Specific Energy and Flow Depth', 'Engineering Foundations', 764, '#', null, null),
  ('0cf6341b-0a69-4d96-9b99-3aee8a15b13a', 'e8f5d984-4e0c-4309-9453-3216da3fe6c7', 1, 'Subcritical, Critical & Supercritical Flow', 'PhysicsHub', 686, '#', null, null),
  ('14e96014-6d47-44b4-a168-c37966626e87', 'c1cacba9-43cd-4bad-bbc0-1d4d3a58d79f', 0, 'Manning''s Equation and the Hydraulic Jump', 'FlowLab', 783, '#', null, null),
  ('97bf92b9-a19d-42f0-9f09-69dc7bbcd89b', '2e1a50be-a0fa-4954-b93b-a62222dacb1f', 0, 'Mach Number and the Speed of Sound', 'Engineering Foundations', 729, '#', null, null),
  ('db931b19-d048-4f1f-be3f-fa9b1c1de6fc', 'eef41e06-ff00-419a-b539-8f6b170de32c', 0, 'From Theory to Lab: Putting It Together', 'FlowLab', 1011, '#', null, null),
  ('9298288a-93f4-4dbd-8d35-522678e4ec57', '1078f466-80c7-47c7-9225-01cd0bf76761', 0, 'Measuring Pressure, Velocity & Flow Rate', 'Engineering Foundations', 798, '#', null, null),
  ('7dce297a-b35b-4c5b-8d35-8c7ffc672bba', '1078f466-80c7-47c7-9225-01cd0bf76761', 1, 'Calibration and Uncertainty Analysis', 'FlowLab', 707, '#', null, null),
  ('331cf1cf-f867-43fb-aacd-0ffc4acf7fe8', 'da7676cd-c7cb-4063-a780-3d1e3629a18b', 0, 'Fluids in Aerospace and Biomedical Systems', 'PhysicsHub', 775, '#', null, null),
  ('7decf0ab-ba43-4e5e-ac2a-0940a6804c26', '7241c437-1cde-4037-84f1-d39d3fdd6f19', 0, 'Theory vs Experiment vs Simulation', 'Engineering Foundations', 742, '#', null, null);

-- Resources
insert into public.curated_course_resources (course_id, kind, title, link_or_site, description, sort_order)
values
  ('01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'textbook'::public.curated_course_resource_kind, 'Fluid Mechanics', 'McGraw Hill', 'White text covering statics, Bernoulli, control volumes, pipe flow, and external flow.', 0),
  ('01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'textbook'::public.curated_course_resource_kind, 'Fundamentals of Fluid Mechanics', 'Wiley', 'Munson text with strong undergraduate engineering examples.', 1),
  ('01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'textbook'::public.curated_course_resource_kind, 'Fluid Mechanics: Fundamentals and Applications', 'McGraw Hill', 'Cengel and Cimbala text with accessible applications and visuals.', 2),
  ('01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'textbook'::public.curated_course_resource_kind, 'Engineering Fluid Mechanics', 'Wiley', 'Crowe text for applied fluids, measurements, and engineering systems.', 3),
  ('01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'textbook'::public.curated_course_resource_kind, 'Introduction to Fluid Mechanics', 'Cambridge University Press', 'Foundational fluid concepts and problem solving.', 4),
  ('01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'website'::public.curated_course_resource_kind, 'MIT OCW Fluid Dynamics', 'https://ocw.mit.edu/courses/2-06-fluid-dynamics-spring-2013/', 'MIT course covering hydrostatics, control volumes, viscous flow, and applications.', 5),
  ('01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'website'::public.curated_course_resource_kind, 'Engineering LibreTexts - Fluid Mechanics', 'https://eng.libretexts.org/Bookshelves/Civil_Engineering', 'Open fluid mechanics text and examples.', 6),
  ('01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'website'::public.curated_course_resource_kind, 'LearnChemE Fluid Mechanics', 'https://learncheme.com/screencasts/fluid-mechanics/', 'Fluid mechanics screencasts for balances, pressure, pipes, and pumps.', 7),
  ('01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'website'::public.curated_course_resource_kind, 'NASA Glenn Beginner''s Guide to Aerodynamics', 'https://www.grc.nasa.gov/www/k-12/airplane/', 'Accessible fluid flow, lift, drag, and compressible flow explanations.', 8),
  ('01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'website'::public.curated_course_resource_kind, 'NPTEL Fluid Mechanics', 'https://nptel.ac.in/courses/112/105/112105171/', 'University lecture course for fluid statics and dynamics.', 9),
  ('01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'youtube'::public.curated_course_resource_kind, 'Jeff Hanson', 'https://www.youtube.com/@1234jhanson', 'Excellent statics, dynamics, mechanics of materials, and vibrations walkthroughs.', 10),
  ('01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'youtube'::public.curated_course_resource_kind, 'StructureFree', 'https://www.youtube.com/@structurefree', 'Engineering mechanics lessons for FBDs, trusses, beams, stress, and strain.', 11),
  ('01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'youtube'::public.curated_course_resource_kind, 'CPPMechEngTutorials', 'https://www.youtube.com/@cppmechengtutorials', 'Engineering mechanics, thermodynamics, fluids, and materials examples.', 12),
  ('01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'youtube'::public.curated_course_resource_kind, 'LearnChemE', 'https://www.youtube.com/@LearnChemE', 'Strong thermodynamics, fluids, controls, and engineering problem-solving videos.', 13),
  ('01c19e0a-b2a7-4807-88b7-fba3475c10aa', 'youtube'::public.curated_course_resource_kind, 'Michel van Biezen', 'https://www.youtube.com/@MichelvanBiezen', 'Large library of solved mechanics, physics, circuits, and math problems.', 14);

-- 182 nodes, 83 videos, 15 resources
