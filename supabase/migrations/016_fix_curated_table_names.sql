-- name: 016_fix_curated_table_names
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
