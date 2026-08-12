-- name: 015_rename_course_video_to_curated
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
